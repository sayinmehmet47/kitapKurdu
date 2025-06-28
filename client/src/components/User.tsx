import { useNavigate } from 'react-router-dom';
import { logoutThunk } from '../redux/authSlice';
import { RootState, useAppDispatch, useAppSelector } from '@/redux/store';
import { toast } from 'sonner';
import {
  User,
  Mail,
  Shield,
  Calendar,
  LogOut,
  Settings,
  BookOpen,
} from 'lucide-react';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function UserProfile() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { username, isAdmin, email } = useAppSelector(
    (state: RootState) => state.authSlice.user.user
  );

  const handleLogout = async () => {
    try {
      await dispatch(logoutThunk()).unwrap();
      toast.success('Successfully logged out');
      navigate('/');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const handleEditProfile = () => {
    toast.info('Profile editing coming soon!');
  };

  const handleViewBooks = () => {
    navigate('/all-books');
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Profile Card */}
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src="/avatars/01.png" alt={username || 'User'} />
                <AvatarFallback className="text-2xl font-semibold bg-primary text-primary-foreground">
                  {username ? username.slice(0, 2).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="text-2xl">{username || 'User'}</CardTitle>
            <CardDescription className="text-base">
              Welcome to your profile dashboard
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* User Info */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Username
                  </p>
                  <p className="text-lg font-semibold">
                    {username || 'Not set'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Email
                  </p>
                  <p className="text-lg font-semibold">{email || 'Not set'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Role
                  </p>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={isAdmin ? 'default' : 'secondary'}
                      className="text-sm"
                    >
                      {isAdmin ? 'Administrator' : 'User'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Quick Actions */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="justify-start h-auto p-4"
                  onClick={handleEditProfile}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  <div className="text-left">
                    <div className="font-medium">Edit Profile</div>
                    <div className="text-xs text-muted-foreground">
                      Update your information
                    </div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="justify-start h-auto p-4"
                  onClick={handleViewBooks}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  <div className="text-left">
                    <div className="font-medium">My Books</div>
                    <div className="text-xs text-muted-foreground">
                      View your library
                    </div>
                  </div>
                </Button>
              </div>
            </div>

            <Separator />

            {/* Account Actions */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Account</h3>
              <Button
                variant="destructive"
                onClick={handleLogout}
                className="w-full"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Account Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">
                  Member since:
                </span>
                <p className="mt-1">Recently joined</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">
                  Account status:
                </span>
                <div className="mt-1">
                  <Badge
                    variant="outline"
                    className="text-green-600 border-green-200"
                  >
                    Active
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
