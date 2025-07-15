"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, Bell, User, Menu } from "lucide-react";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <div className="sticky top-0 z-40 mb-8">
      <Card className="glass-card p-0">
        <div className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden mr-2 flex-shrink-0"
                onClick={onMenuClick}
              >
                <Menu size={20} />
              </Button>
              <div className="min-w-0">
                <h2 className="text-xl md:text-2xl font-bold text-foreground mb-1 truncate">
                  Welcome back!
                </h2>
                <p className="text-muted-foreground text-sm hidden sm:block">
                  Here's what's happening with your platform today.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
              <div className="relative hidden lg:block">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                  size={20}
                />
                <Input placeholder="Search..." className="pl-10 w-48 xl:w-64" />
              </div>
              <Button variant="ghost" size="icon" className="hidden sm:flex">
                <Bell size={20} />
              </Button>
              <Button variant="ghost" size="icon">
                <User size={20} />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
