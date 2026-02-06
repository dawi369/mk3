"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Bell, Monitor, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/providers/auth-provider";
import { updateProfile } from "@/lib/supabase/profiles";
import { toast } from "sonner";

const ANIMATION_CONFIG = {
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  },
  stagger: {
    animate: { transition: { staggerChildren: 0.1 } },
  },
};

export default function SettingsPage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Populate form when profile loads
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const success = await updateProfile(user.id, {
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        display_name: firstName.trim() || "Trader",
      });

      if (success) {
        await refreshProfile();
        toast.success("Profile updated successfully");
      } else {
        toast.error("Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Please log in to access settings.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <div className="relative z-10 mx-auto max-w-4xl px-6 py-24">
        <motion.div
          initial="initial"
          animate="animate"
          variants={ANIMATION_CONFIG.stagger}
        >
          {/* Header */}
          <motion.div variants={ANIMATION_CONFIG.fadeInUp} className="mb-10">
            <h1 className="text-4xl font-bold font-space tracking-tight text-foreground md:text-5xl mb-4">
              Settings
            </h1>
            <p className="text-xl text-muted-foreground">
              Manage your account preferences and application settings.
            </p>
          </motion.div>

          {/* Content */}
          <motion.div variants={ANIMATION_CONFIG.fadeInUp}>
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="mb-8">
                <TabsTrigger value="general" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  General
                </TabsTrigger>
                <TabsTrigger value="appearance" className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  Appearance
                </TabsTrigger>
                <TabsTrigger value="notifications" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notifications
                </TabsTrigger>
              </TabsList>

              <TabsContent value="general">
                <Card className="bg-card">
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                      Update your account profile details.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="first-name">First name</Label>
                        <Input
                          id="first-name"
                          placeholder="Enter your first name"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          disabled={isSaving}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last-name">Last name</Label>
                        <Input
                          id="last-name"
                          placeholder="Enter your last name"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          disabled={isSaving}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={user.email || ""}
                        disabled
                        className="bg-muted/50"
                      />
                      <p className="text-xs text-muted-foreground">
                        Email cannot be changed here.
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end border-t p-6">
                    <Button onClick={handleSaveProfile} disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="appearance">
                <Card className="bg-card">
                  <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>
                      Customize how Swordfish looks on your device.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <Label className="text-base">Dark Mode</Label>
                        <p className="text-sm text-muted-foreground">
                          Toggle between light and dark themes.
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <Label className="text-base">Reduced Motion</Label>
                        <p className="text-sm text-muted-foreground">
                          Minimize animations for a simpler experience.
                        </p>
                      </div>
                      <Switch />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end border-t p-6">
                    <Button>Save Preferences</Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="notifications">
                <Card className="bg-card">
                  <CardHeader>
                    <CardTitle>Notifications</CardTitle>
                    <CardDescription>
                      Configure how you want to be notified about activity.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Email Notifications
                      </h3>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <Label htmlFor="marketing-emails" className="flex flex-col gap-1">
                          <span>Marketing emails</span>
                          <span className="font-normal text-muted-foreground">
                            Receive emails about new features and offers.
                          </span>
                        </Label>
                        <Switch id="marketing-emails" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="security-emails" className="flex flex-col gap-1">
                          <span>Security emails</span>
                          <span className="font-normal text-muted-foreground">
                            Receive emails about your account security.
                          </span>
                        </Label>
                        <Switch id="security-emails" defaultChecked disabled />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end border-t p-6">
                    <Button>Update Notifications</Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
