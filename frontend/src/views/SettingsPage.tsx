/**
 * Settings Page - User configuration
 */
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useConfigStore } from '@/store/configStore';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Settings, User, Clock, Calendar, Save, Loader2, Palette, Layers, Crown } from 'lucide-react';
import type { HeatmapStyle, TimeDisplayMode } from '@/store/configStore';
import { useToast } from '@/hooks/use-toast';
import { WorkspaceManager } from '@/components/workspace';
import { PricingModal } from '@/components/subscription/PricingModal';

export function SettingsPage() {
  const { user } = useAuthStore();
  const { targetHours, weekStartDay, heatmapStyle, timeDisplayMode, updateConfig, setHeatmapStyle, setTimeDisplayMode, isLoading } = useConfigStore();
  const { workspaces } = useWorkspaceStore();
  const { currentPlan, subscription, isFree, fetchCurrentSubscription } = useSubscriptionStore();
  const { toast } = useToast();

  const [localTargetHours, setLocalTargetHours] = useState(String(targetHours));
  const [localWeekStartDay, setLocalWeekStartDay] = useState(String(weekStartDay));
  const [isWorkspaceManagerOpen, setIsWorkspaceManagerOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

  // Fetch subscription on mount
  useEffect(() => {
    fetchCurrentSubscription();
  }, [fetchCurrentSubscription]);

  const handleHeatmapStyleChange = (value: string) => {
    setHeatmapStyle(value as HeatmapStyle);
  };

  const handleTimeDisplayModeChange = (value: string) => {
    setTimeDisplayMode(value as TimeDisplayMode);
  };

  const handleSave = async () => {
    const targetValue = parseFloat(localTargetHours) || 0;
    const weekStartValue = parseInt(localWeekStartDay, 10);

    if (targetValue < 0) {
      toast({
        title: 'Error',
        description: 'Value must be greater than or equal to 0',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateConfig({
        targetHours: targetValue,
        weekStartDay: weekStartValue,
      });
      toast({
        title: 'Success',
        description: 'Settings saved successfully!',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Settings</h1>
      </div>

      {/* User Profile Card */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <User className="h-4 w-4 sm:h-5 sm:w-5" />
            Profile
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Your account information</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {user ? (
            <div className="flex items-center gap-3 sm:gap-4">
              {user.image && (
                <img
                  src={user.image}
                  alt={user.name || 'User'}
                  className="h-12 w-12 sm:h-16 sm:w-16 rounded-full"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-base sm:text-lg font-medium text-foreground truncate">{user.name}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Loading...</p>
          )}
        </CardContent>
      </Card>

      {/* Plan Card */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Crown className="h-4 w-4 sm:h-5 sm:w-5" />
            Plan
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Manage your subscription and view available features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 pt-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className={`p-1.5 sm:p-2 rounded-lg ${isFree ? 'bg-muted' : 'bg-primary/10'}`}>
              <Crown className={`h-4 w-4 sm:h-5 sm:w-5 ${isFree ? 'text-muted-foreground' : 'text-primary'}`} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm sm:text-base">{currentPlan?.displayName || 'Free'}</span>
                {!isFree && subscription?.status === 'ACTIVE' && (
                  <Badge variant="default" className="bg-green-500 text-xs">Active</Badge>
                )}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {isFree
                  ? 'Upgrade to unlock more features'
                  : subscription?.billingCycle === 'LIFETIME'
                    ? 'Lifetime access - never expires'
                    : subscription?.billingCycle === 'YEARLY'
                      ? 'Billed annually'
                      : 'Billed monthly'
                }
              </p>
            </div>
          </div>
          {isFree && (
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsPricingModalOpen(true)}
              className="w-full sm:w-auto"
            >
              <Crown className="h-4 w-4 mr-2" />
              Upgrade
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Workspaces Card */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Layers className="h-4 w-4 sm:h-5 sm:w-5" />
            Workspaces
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Organize your work sessions into different contexts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 pt-0">
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {workspaces.map((workspace) => (
              <div
                key={workspace.id}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-muted text-xs sm:text-sm"
              >
                <div
                  className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: workspace.color || '#6366f1' }}
                />
                <span className="truncate max-w-[100px] sm:max-w-none">{workspace.name}</span>
                {workspace.isDefault && (
                  <span className="text-[10px] sm:text-xs text-muted-foreground">(Default)</span>
                )}
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsWorkspaceManagerOpen(true)}
            className="w-full sm:w-auto"
          >
            <Layers className="h-4 w-4 mr-2" />
            Manage Workspaces
          </Button>
        </CardContent>
      </Card>

      {/* Weekly Goals Card */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
            Default Weekly Goal
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Set the default hours for new weeks. You can customize individual weeks by clicking the "Total" column in the calendar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 pt-0">
          <div className="space-y-2 max-w-full sm:max-w-xs">
            <Label htmlFor="targetHours" className="text-sm">
              Hours per Week
            </Label>
            <Input
              id="targetHours"
              type="number"
              min="0"
              max="168"
              step="0.5"
              value={localTargetHours}
              onChange={(e) => setLocalTargetHours(e.target.value)}
              className="w-full"
            />
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Weeks that reach this goal turn green in the calendar
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Settings Card */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
            Calendar
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Configure how the calendar is displayed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <Label htmlFor="weekStartDay" className="text-sm">
                Week Start Day
              </Label>
              <Select
                value={localWeekStartDay}
                onValueChange={setLocalWeekStartDay}
              >
                <SelectTrigger id="weekStartDay" className="w-full">
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sunday</SelectItem>
                  <SelectItem value="1">Monday</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Sets which day appears first in the calendar
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="heatmapStyle" className="flex items-center gap-2 text-sm">
                <Palette className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Calendar Style
              </Label>
              <Select
                value={heatmapStyle}
                onValueChange={handleHeatmapStyleChange}
              >
                <SelectTrigger id="heatmapStyle" className="w-full">
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gradient">Gradient (colors)</SelectItem>
                  <SelectItem value="dots">Dots (minimalist)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                How work intensity is displayed in calendar cells
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeDisplayMode" className="flex items-center gap-2 text-sm">
                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Time Display
              </Label>
              <Select
                value={timeDisplayMode}
                onValueChange={handleTimeDisplayModeChange}
              >
                <SelectTrigger id="timeDisplayMode" className="w-full">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hours">🕐 Hours</SelectItem>
                  <SelectItem value="pomodoros">🍅 Pomodoros</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                1 pomodoro = 25 minutes
              </p>
            </div>
          </div>

          <Button onClick={handleSave} disabled={isLoading} size="sm" className="w-full sm:w-auto">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Settings
          </Button>
        </CardContent>
      </Card>

      {/* Workspace Manager Modal */}
      <WorkspaceManager
        isOpen={isWorkspaceManagerOpen}
        onClose={() => setIsWorkspaceManagerOpen(false)}
      />

      {/* Pricing Modal */}
      <PricingModal
        open={isPricingModalOpen}
        onOpenChange={setIsPricingModalOpen}
      />
    </div>
  );
}

export default SettingsPage;
