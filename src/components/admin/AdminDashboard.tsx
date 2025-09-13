import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { LogOut, Settings, PlusCircle, Edit, Trash2, Shield, Users, AlertTriangle, CheckCircle, Lock, Key, Database, FileText } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AdminDashboardProps {
  onLogout: () => void;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: "voter" | "manager" | "admin";
  status: "active" | "inactive";
  lastLogin: Date | null;
}

// Shape of user objects returned by the API
interface ApiUser {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  role: User["role"];
  lastLogin?: string | null;
}

interface SystemLog {
  id: string;
  timestamp: Date;
  action: string;
  user: string;
  details: string;
  level: "info" | "warning" | "error";
}

interface SystemSetting {
  id: string;
  name: string;
  value: string;
  description: string;
  category: "security" | "voting" | "general";
}

export const AdminDashboard = ({ onLogout }: AdminDashboardProps) => {
  const [activeTab, setActiveTab] = useState("users");
  const [showNewUserDialog, setShowNewUserDialog] = useState(false);
  
  // Users state, loaded from API
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);

  // Pending approvals count (polling)
  const [pendingCount, setPendingCount] = useState<number>(0);

  // Fetch users from API
  const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        setUserError(null);
        const res = await fetch(`${API_BASE}/admin/users`, { credentials: "include" });
        if (!res.ok) throw new Error("Failed to load users");
        const data: ApiUser[] = await res.json();
        // Map API -> UI type
        const mapped: User[] = data.map((u) => ({
          id: u._id || u.id || crypto.randomUUID(),
          name: u.name,
          email: u.email,
          role: u.role,
          status: "active", // no status in API; default to active
          lastLogin: u.lastLogin ? new Date(u.lastLogin) : null,
        }));
        setUsers(mapped);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to load users";
        setUserError(message);
      } finally {
        setLoadingUsers(false);
      }
    };

    const loadPending = async () => {
      try {
        const res = await fetch(`${API_BASE}/admin/pending-users`, { credentials: "include" });
        if (!res.ok) return;
        const list = await res.json();
        setPendingCount(Array.isArray(list) ? list.length : 0);
      } catch {
        // ignore errors for badge
      }
    };

    loadUsers();
    loadPending();
    const id = setInterval(loadPending, 15000); // poll every 15s
    return () => clearInterval(id);
  }, []);

  
  // Mock system settings
  const [systemSettings, setSystemSettings] = useState<SystemSetting[]>([
    {
      id: "setting1",
      name: "Two-Factor Authentication",
      value: "enabled",
      description: "Require two-factor authentication for all admin and manager accounts",
      category: "security"
    },
    {
      id: "setting2",
      name: "Session Timeout",
      value: "20",
      description: "User session timeout in minutes",
      category: "security"
    },
    {
      id: "setting3",
      name: "Vote Confirmation",
      value: "enabled",
      description: "Require confirmation step before finalizing votes",
      category: "voting"
    },
    {
      id: "setting4",
      name: "Results Visibility",
      value: "after_completion",
      description: "When election results are visible to voters",
      category: "voting"
    },
    {
      id: "setting5",
      name: "System Name",
      value: "VoteRight Secure",
      description: "Name displayed throughout the application",
      category: "general"
    }
  ]);

  // Form state
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "voter" as "voter" | "manager" | "admin",
    password: ""
  });

  const handleCreateUser = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newUser),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.message || "Failed to create user");
        return;
      }
      // Optimistically add to list
      setUsers([
        ...users,
        {
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role,
          status: "active",
          lastLogin: null,
        },
      ]);
      setNewUser({ name: "", email: "", role: "voter", password: "" });
      setShowNewUserDialog(false);

      // Log
      const newLog: SystemLog = {
        id: `log${Date.now()}`,
        timestamp: new Date(),
        action: "User Created",
        user: "Admin",
        details: `New ${newUser.role} account created: ${newUser.name}`,
        level: "info",
      };
      setSystemLogs([newLog, ...systemLogs]);
    } catch (e) {
      alert("Network error while creating user");
    }
  };

  const handleDeleteUser = async (id: string) => {
    const target = users.find(u => u.id === id);
    try {
      const res = await fetch(`${API_BASE}/admin/users/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete user");
      setUsers(users.filter(user => user.id !== id));
      if (target) {
        const newLog: SystemLog = {
          id: `log${Date.now()}`,
          timestamp: new Date(),
          action: "User Deleted",
          user: "Admin",
          details: `User account deleted: ${target.name}`,
          level: "warning",
        };
        setSystemLogs([newLog, ...systemLogs]);
      }
    } catch {
      alert("Network error while deleting user");
    }
  };

  const handleToggleUserStatus = (id: string) => {
    const updatedUsers = users.map((user): User => {
      if (user.id === id) {
        const newStatus: User["status"] = user.status === "active" ? "inactive" : "active";
        
        // Add to system logs
        const newLog: SystemLog = {
          id: `log${Date.now()}`,
          timestamp: new Date(),
          action: "User Status Changed",
          user: "Admin",
          details: `User ${user.name} status changed to ${newStatus}`,
          level: "info"
        };
        setSystemLogs([newLog, ...systemLogs]);
        
        return { ...user, status: newStatus };
      }
      return user;
    });
    
    setUsers(updatedUsers);
  };

  const handleUpdateSetting = (id: string, value: string) => {
    const updatedSettings = systemSettings.map(setting => {
      if (setting.id === id) {
        // Add to system logs
        const newLog: SystemLog = {
          id: `log${Date.now()}`,
          timestamp: new Date(),
          action: "Setting Updated",
          user: "Admin",
          details: `System setting "${setting.name}" updated to "${value}"`,
          level: "info"
        };
        setSystemLogs([newLog, ...systemLogs]);
        
        return { ...setting, value };
      }
      return setting;
    });
    
    setSystemSettings(updatedSettings);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Never";
    
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getLogLevelBadge = (level: string) => {
    switch (level) {
      case "info": return <Badge variant="outline" className="bg-blue-50">Info</Badge>;
      case "warning": return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Warning</Badge>;
      case "error": return <Badge variant="outline" className="bg-red-50 text-red-700">Error</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin": return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Admin</Badge>;
      case "manager": return <Badge variant="secondary">Manager</Badge>;
      case "voter": return <Badge variant="outline">Voter</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary rounded-lg">
                <Settings className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">System Administration</h1>
                <p className="text-sm text-muted-foreground">Manage users and system settings</p>
              </div>
              {pendingCount > 0 && (
                <Badge variant="secondary" className="ml-3">{pendingCount} pending approvals</Badge>
              )}
            </div>
            
            <Button onClick={onLogout} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="settings">System Settings</TabsTrigger>
            <TabsTrigger value="logs">Audit Logs</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>
          
          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">User Management</h2>
              <Dialog open={showNewUserDialog} onOpenChange={setShowNewUserDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                    <DialogDescription>
                      Add a new user to the system.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input 
                        id="name" 
                        value={newUser.name}
                        onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                        placeholder="Enter user's full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input 
                        id="email" 
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                        placeholder="Enter email address"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">User Role</Label>
                      <Select 
                        value={newUser.role} 
                        onValueChange={(value) => setNewUser({...newUser, role: value as "voter" | "manager" | "admin"})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="voter">Voter</SelectItem>
                          <SelectItem value="manager">Election Manager</SelectItem>
                          <SelectItem value="admin">System Administrator</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Initial Password</Label>
                      <Input 
                        id="password" 
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                        placeholder="Enter initial password"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowNewUserDialog(false)}>Cancel</Button>
                    <Button onClick={handleCreateUser}>Create User</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Managers */}
            <Card>
              <CardHeader>
                <CardTitle>Managers</CardTitle>
                <CardDescription>All manager accounts</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.filter(u => u.role === "manager").map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{formatDate(user.lastLogin)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Voters */}
            <Card>
              <CardHeader>
                <CardTitle>Voters</CardTitle>
                <CardDescription>All voter accounts</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.filter(u => u.role === "voter").map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{formatDate(user.lastLogin)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <div>Total: {users.length} users | Managers: {users.filter(u=>u.role==="manager").length} | Voters: {users.filter(u=>u.role==="voter").length}</div>
            </div>
          </TabsContent>
          
          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <h2 className="text-2xl font-bold">System Settings</h2>
            
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Configure security-related system settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {systemSettings
                    .filter(setting => setting.category === "security")
                    .map(setting => (
                      <div key={setting.id} className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="font-medium">{setting.name}</div>
                          <div className="text-sm text-muted-foreground">{setting.description}</div>
                        </div>
                        {setting.name === "Two-Factor Authentication" ? (
                          <div className="flex items-center space-x-2">
                            <Switch 
                              checked={setting.value === "enabled"} 
                              onCheckedChange={(checked) => 
                                handleUpdateSetting(setting.id, checked ? "enabled" : "disabled")
                              }
                            />
                            <span>{setting.value === "enabled" ? "Enabled" : "Disabled"}</span>
                          </div>
                        ) : (
                          <div className="w-[180px]">
                            <Input 
                              value={setting.value}
                              onChange={(e) => handleUpdateSetting(setting.id, e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Voting Settings</CardTitle>
                  <CardDescription>Configure voting-related system settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {systemSettings
                    .filter(setting => setting.category === "voting")
                    .map(setting => (
                      <div key={setting.id} className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="font-medium">{setting.name}</div>
                          <div className="text-sm text-muted-foreground">{setting.description}</div>
                        </div>
                        {setting.name === "Vote Confirmation" ? (
                          <div className="flex items-center space-x-2">
                            <Switch 
                              checked={setting.value === "enabled"} 
                              onCheckedChange={(checked) => 
                                handleUpdateSetting(setting.id, checked ? "enabled" : "disabled")
                              }
                            />
                            <span>{setting.value === "enabled" ? "Enabled" : "Disabled"}</span>
                          </div>
                        ) : (
                          <div className="w-[180px]">
                            <Select 
                              value={setting.value} 
                              onValueChange={(value) => handleUpdateSetting(setting.id, value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="after_completion">After Completion</SelectItem>
                                <SelectItem value="real_time">Real-time</SelectItem>
                                <SelectItem value="hidden">Hidden</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>Configure general system settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {systemSettings
                    .filter(setting => setting.category === "general")
                    .map(setting => (
                      <div key={setting.id} className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="font-medium">{setting.name}</div>
                          <div className="text-sm text-muted-foreground">{setting.description}</div>
                        </div>
                        <div className="w-[180px]">
                          <Input 
                            value={setting.value}
                            onChange={(e) => handleUpdateSetting(setting.id, e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">System Audit Logs</h2>
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Export Logs
              </Button>
            </div>
            
            <Card>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[180px]">Timestamp</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead className="w-[100px]">Level</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {systemLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-muted-foreground">
                            {formatDate(log.timestamp)}
                          </TableCell>
                          <TableCell className="font-medium">{log.action}</TableCell>
                          <TableCell>{log.user}</TableCell>
                          <TableCell>{log.details}</TableCell>
                          <TableCell>{getLogLevelBadge(log.level)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4">
            <h2 className="text-2xl font-bold">Security Center</h2>
            
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <CardTitle>System Security Status</CardTitle>
                  </div>
                  <CardDescription>Overview of system security</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg border border-green-100 flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-800">System Security is Good</p>
                        <p className="text-sm text-green-700">All security measures are active and up to date</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <Lock className="h-4 w-4 text-muted-foreground" />
                          <span>Two-Factor Authentication</span>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700">Enabled</Badge>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <Key className="h-4 w-4 text-muted-foreground" />
                          <span>Password Policy</span>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700">Strong</Badge>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <Database className="h-4 w-4 text-muted-foreground" />
                          <span>Database Encryption</span>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700">Active</Badge>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                          <span>Intrusion Detection</span>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700">Monitoring</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    <CardTitle>Recent Security Events</CardTitle>
                  </div>
                  <CardDescription>Security-related system events</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {systemLogs
                      .filter(log => log.level === "warning" || log.level === "error" || log.action.includes("Login"))
                      .slice(0, 5)
                      .map(log => (
                        <div key={log.id} className="flex items-start space-x-3">
                          {log.level === "error" ? (
                            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                          ) : log.level === "warning" ? (
                            <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                          ) : (
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                          )}
                          <div className="space-y-1">
                            <div className="font-medium">{log.action}</div>
                            <div className="text-sm text-muted-foreground">{log.details}</div>
                            <div className="text-xs text-muted-foreground">{formatDate(log.timestamp)}</div>
                          </div>
                        </div>
                      ))}
                      
                    <Button variant="outline" className="w-full">
                      View All Security Events
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Security Actions</CardTitle>
                  <CardDescription>Perform security-related actions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center">
                      <Shield className="h-6 w-6 mb-2" />
                      <span>Run Security Scan</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center">
                      <Database className="h-6 w-6 mb-2" />
                      <span>Backup Database</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center">
                      <Key className="h-6 w-6 mb-2" />
                      <span>Reset Admin Password</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};