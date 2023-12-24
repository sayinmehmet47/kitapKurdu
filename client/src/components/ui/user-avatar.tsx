import { useDispatch } from 'react-redux';
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
import { Dispatch } from '@reduxjs/toolkit';
import { logoutThunk } from '../../redux/authSlice';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from './button';

export interface UserNavProps {
  avatarUrl?: string;
  username?: string;
  email?: string;
}

export function UserNav({
  avatarUrl = '/avatars/01.png',
  username = 'shadcn',
  email = 'exampe@example.com',
}: UserNavProps) {
  const dispatch = useDispatch<Dispatch<any>>();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logoutThunk());
    toast.success('Logout successful');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="h-10 w-10">
          <AvatarImage src={avatarUrl} alt="@shadcn" />
          <AvatarFallback>
            {username ? (
              username.slice(0, 2).toUpperCase()
            ) : (
              <Button
                variant="ghost"
                className="text-muted-foreground shrink-0"
              >
                Login
              </Button>
            )}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
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
          <DropdownMenuItem>
            <Link to={username ? '/login' : '/register'}>
              {username ? <span>Profile</span> : <span>Register</span>}
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={username ? handleLogout : handleLogin}>
          {username ? <span>Logout</span> : <span>Login</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
