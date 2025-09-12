import { Router } from "express";
import { Types } from "mongoose";
import { requireAuth, requireRole } from "../middleware/auth";
import { adminRateLimiter } from "../middleware/rateLimit";
import { Election } from "../models/Election";
import { Vote } from "../models/Vote";

const router = Router();

// Create an election (manager/admin)
router.post("/", requireAuth, requireRole("manager", "admin"), adminRateLimiter, async (req, res) => {
  try {
    const { title, candidates, endAt } = req.body as { title: string; candidates: { name: string }[]; endAt?: string };
    if (!title || !Array.isArray(candidates) || candidates.length === 0) {
      return res.status(400).json({ message: "title and candidates required" });
    }
    const election = await Election.create({
      title,
      candidates,
      createdBy: new Types.ObjectId(req.user!.id),
      endAt: endAt ? new Date(endAt) : undefined,
    });
    res.status(201).json(election);
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    res.status(500).json({ message: "Failed to create election", error: errorMessage });
  }
});

// List elections (basic info)
router.get("/", requireAuth, async (_req, res) => {
  const list = await Election.find().select("title status published endAt createdAt updatedAt");
  res.json(list);
});

// Close an election (manager/admin)
router.post("/:id/close", requireAuth, requireRole("manager", "admin"), adminRateLimiter, async (req, res) => {
  const { id } = req.params;
  const election = await Election.findById(id);
  if (!election) return res.status(404).json({ message: "Election not found" });
  if (election.status === "closed") return res.status(400).json({ message: "Already closed" });
  election.status = "closed";
  await election.save();
  res.json({ message: "Election closed" });
});

// Publish results (manager only) — after closed
router.post("/:id/publish", requireAuth, requireRole("manager"), adminRateLimiter, async (req, res) => {
  const { id } = req.params;
  const election = await Election.findById(id);
  if (!election) return res.status(404).json({ message: "Election not found" });
  if (election.status !== "closed") return res.status(400).json({ message: "Election must be closed before publishing" });
  if (election.published) return res.status(400).json({ message: "Already published" });
  election.published = true;
  await election.save();
  res.json({ message: "Results published" });
});

// Vote (voter only) — only while open
router.post("/:id/vote", requireAuth, requireRole("voter"), async (req, res) => {
  const { id } = req.params;
  const { candidateId } = req.body as { candidateId: string };
  const election = await Election.findById(id);
  if (!election) return res.status(404).json({ message: "Election not found" });
  if (election.status !== "open") return res.status(400).json({ message: "Election is not open" });
  if (election.endAt && new Date() > election.endAt) {
    election.status = "closed";
    await election.save();
    return res.status(400).json({ message: "Election already ended" });
  }
  // Validate candidateId by comparing stringified ObjectIds
  const hasCandidate = !!candidateId && election.candidates.some((c) => c._id?.toString() === candidateId);
  if (!hasCandidate) {
    return res.status(400).json({ message: "Invalid candidateId" });
  }
  try {
    await Vote.create({ electionId: election._id, voterId: new Types.ObjectId(req.user!.id), candidateId: new Types.ObjectId(candidateId) });
    res.status(201).json({ message: "Vote recorded" });
  } catch (e: unknown) {
    if (typeof e === "object" && e !== null && "code" in e && (e as { code?: number }).code === 11000) {
      return res.status(409).json({ message: "You have already voted in this election" });
    }
    const errorMessage = e instanceof Error ? e.message : String(e);
    res.status(500).json({ message: "Failed to record vote", error: errorMessage });
  }
});

// Aggregated results — visible only if published and only to voters
router.get("/:id/results", requireAuth, async (req, res) => {
  const { id } = req.params;
  const election = await Election.findById(id);
  if (!election) return res.status(404).json({ message: "Election not found" });

  const role = req.user!.role;
  const canView = election.published && role === "voter";
  if (!canView) return res.status(403).json({ message: "Results not available" });

  const pipeline = [
    { $match: { electionId: new Types.ObjectId(id) } },
    { $group: { _id: "$candidateId", total: { $sum: 1 } } },
  ];
  const grouped = await Vote.aggregate(pipeline);

  // Map candidate names
  const result = election.candidates.map((c) => ({
    candidate_id: c._id.toString(),
    candidate_name: c.name,
    total_votes: grouped.find((g) => g._id?.toString() === c._id.toString())?.total || 0,
  }));
  const electionIdStr = String(election._id);
  res.json({ election_id: electionIdStr, title: election.title, results: result });
});

// CSV export — aggregated (manager only)
router.get("/:id/results.csv", requireAuth, requireRole("manager"), async (req, res) => {
  const { id } = req.params;
  const election = await Election.findById(id);
  if (!election) return res.status(404).json({ message: "Election not found" });

  const pipeline = [
    { $match: { electionId: new Types.ObjectId(id) } },
    { $group: { _id: "$candidateId", total: { $sum: 1 } } },
  ];
  const grouped = await Vote.aggregate(pipeline);
  const rows = ["election_id,candidate_id,candidate_name,total_votes"];
  const electionIdStr = String(election._id);
  for (const c of election.candidates) {
    const total = grouped.find((g) => g._id?.toString() === c._id.toString())?.total || 0;
    rows.push(`${electionIdStr},${c._id},"${c.name.replace(/"/g, '""')}",${total}`);
  }
  const csv = rows.join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename=results_${electionIdStr}.csv`);
  res.send(csv);
});

// CSV export — raw (manager/admin only)
router.get("/:id/results_raw.csv", requireAuth, requireRole("manager", "admin"), async (req, res) => {
  const { id } = req.params;
  const election = await Election.findById(id);
  if (!election) return res.status(404).json({ message: "Election not found" });

  const votes = await Vote.find({ electionId: election._id }).select("voterId candidateId createdAt");
  const rows = ["election_id,voter_id,candidate_id,timestamp"];
  const electionIdStr = String(election._id);
  for (const v of votes) {
    rows.push(`${electionIdStr},${v.voterId},${v.candidateId},${v.createdAt.toISOString()}`);
  }
  const csv = rows.join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename=results_raw_${electionIdStr}.csv`);
  res.send(csv);
});

export default router;
