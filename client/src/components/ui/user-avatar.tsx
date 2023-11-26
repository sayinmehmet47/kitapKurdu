import { useDispatch } from 'react-redux';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { Dispatch } from '@reduxjs/toolkit';
import { logoutThunk } from '../../redux/authSlice';
import { Link } from 'react-router-dom';

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

  const handleLogout = () => {
    dispatch(logoutThunk());
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-8 w-8 rounded-full hover:w-8"
        >
          <Avatar className="h-8 w-8 hover:w-8">
            <AvatarImage src={avatarUrl} alt="@shadcn" />
            <AvatarFallback>
              {username
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </AvatarFallback>
          </Avatar>
        </Button>
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
            <Link to="/login">Profile</Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
