import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { logoutThunk } from '../../redux/authSlice';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from './button';
import { useAppDispatch } from '@/redux/store';

export interface UserNavProps {
  avatarUrl?: string;
  username?: string;
  email?: string;
}

export function UserNav({
  avatarUrl = '/avatars/01.png',
  username = '',
  email = '',
}: UserNavProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await dispatch(logoutThunk()).unwrap();
      toast.success('Logout successful');
    } catch (error) {
      toast.error('Logout failed');
    }
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleRegister = () => {
    navigate('/register');
  };

  const handleProfile = () => {
    navigate('/profile');
  };

  // Check if user is logged in (has username)
  const isLoggedIn = username && username.trim() !== '';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="h-10 w-10 cursor-pointer">
          <AvatarImage src={avatarUrl} alt={username || 'User'} />
          <AvatarFallback>
            {isLoggedIn ? (
              username.slice(0, 2).toUpperCase()
            ) : (
              <Button
                variant="ghost"
                className="text-muted-foreground shrink-0"
                onClick={handleLogin}
              >
                Login
              </Button>
            )}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        {isLoggedIn ? (
          <>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{username}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleProfile}>
                <span>Profile</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <span>Logout</span>
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Welcome!</p>
                <p className="text-xs leading-none text-muted-foreground">
                  Please sign in or register
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleLogin}>
                <span>Login</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleRegister}>
                <span>Register</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
