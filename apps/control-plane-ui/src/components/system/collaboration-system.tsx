/**
 * Real-time Collaboration System
 * Multi-user editing with live cursors and changes
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Wifi,
  WifiOff,
  Eye,
  Edit,
  MessageCircle,
  Send,
  MousePointer,
  Activity,
  Clock,
} from "lucide-react";

interface CollaborationUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  cursor?: { x: number; y: number };
  color: string;
  isActive: boolean;
  lastSeen: Date;
  role: "owner" | "editor" | "viewer";
}

interface CollaborationChange {
  id: string;
  userId: string;
  type: "widget-add" | "widget-edit" | "widget-delete" | "widget-move";
  widgetId: string;
  timestamp: Date;
  data: any;
}

interface Comment {
  id: string;
  userId: string;
  widgetId?: string;
  x: number;
  y: number;
  content: string;
  timestamp: Date;
  resolved: boolean;
  replies: Comment[];
}

interface CollaborationSystemProps {
  dashboardId: string;
  currentUserId: string;
  onUserChange?: (users: CollaborationUser[]) => void;
  onCommentAdd?: (comment: Comment) => void;
}

export default function CollaborationSystem({
  dashboardId,
  currentUserId,
  onUserChange,
  onCommentAdd,
}: CollaborationSystemProps) {
  const [users, setUsers] = useState<CollaborationUser[]>([]);
  const [changes, setChanges] = useState<CollaborationChange[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [commentPosition, setCommentPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Simulate WebSocket connection
  useEffect(() => {
    // Initialize mock users
    const mockUsers: CollaborationUser[] = [
      {
        id: currentUserId,
        name: "You",
        email: "you@example.com",
        color: "#3B82F6",
        isActive: true,
        lastSeen: new Date(),
        role: "owner",
      },
      {
        id: "user-2",
        name: "Sarah Chen",
        email: "sarah@example.com",
        color: "#10B981",
        isActive: true,
        lastSeen: new Date(),
        role: "editor",
      },
      {
        id: "user-3",
        name: "Mike Johnson",
        email: "mike@example.com",
        color: "#F59E0B",
        isActive: false,
        lastSeen: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        role: "viewer",
      },
    ];

    setUsers(mockUsers);
    setIsConnected(true);
    onUserChange?.(mockUsers);

    // Simulate real-time cursor updates
    const interval = setInterval(() => {
      setUsers((prev) =>
        prev.map((user) => ({
          ...user,
          cursor:
            user.isActive && user.id !== currentUserId
              ? {
                  x: Math.random() * 800,
                  y: Math.random() * 600,
                }
              : user.cursor,
        }))
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [dashboardId, currentUserId, onUserChange]);

  const addComment = useCallback(
    (x: number, y: number, content: string) => {
      const comment: Comment = {
        id: `comment-${Date.now()}`,
        userId: currentUserId,
        x,
        y,
        content,
        timestamp: new Date(),
        resolved: false,
        replies: [],
      };

      setComments((prev) => [...prev, comment]);
      onCommentAdd?.(comment);
      setNewComment("");
      setCommentPosition(null);
    },
    [currentUserId, onCommentAdd]
  );

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (showComments) {
        const rect = e.currentTarget.getBoundingClientRect();
        setCommentPosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    },
    [showComments]
  );

  return (
    <>
      {/* Collaboration Toolbar */}
      <div className="flex items-center space-x-4 p-4 bg-white border-b border-gray-200">
        {/* Connection Status */}
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <Wifi className="w-4 h-4 text-green-500" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-500" />
          )}
          <span className="text-sm text-gray-600">
            {isConnected ? "Connected" : "Disconnected"}
          </span>
        </div>

        {/* Active Users */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowUsers(!showUsers)}
            className="flex items-center space-x-2"
          >
            <Users className="w-4 h-4" />
            <span>{users.filter((u) => u.isActive).length} active</span>
          </Button>

          <div className="flex -space-x-2">
            {users.slice(0, 3).map((user) => (
              <div
                key={user.id}
                className="relative"
                style={{ zIndex: users.indexOf(user) }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white"
                  style={{ backgroundColor: user.color }}
                  title={user.name}
                >
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                {user.isActive && (
                  <div
                    className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"
                    title="Active"
                  />
                )}
              </div>
            ))}
            {users.length > 3 && (
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-medium border-2 border-white">
                +{users.length - 3}
              </div>
            )}
          </div>
        </div>

        {/* Comments Toggle */}
        <Button
          variant={showComments ? "default" : "ghost"}
          size="sm"
          onClick={() => setShowComments(!showComments)}
          className="flex items-center space-x-2"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Comments</span>
          {comments.filter((c) => !c.resolved).length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {comments.filter((c) => !c.resolved).length}
            </Badge>
          )}
        </Button>

        {/* Activity Indicator */}
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Activity className="w-4 h-4" />
          <span>Last change: 2 minutes ago</span>
        </div>
      </div>

      {/* Users Panel */}
      {showUsers && (
        <div className="absolute top-16 right-4 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Collaborators</h3>
          </div>
          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            {users.map((user) => (
              <div key={user.id} className="flex items-center space-x-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                  style={{ backgroundColor: user.color }}
                >
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">
                      {user.name}
                    </span>
                    {user.isActive ? (
                      <Badge variant="secondary" className="text-xs">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1" />
                        Online
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        {Math.floor(
                          (Date.now() - user.lastSeen.getTime()) / 60000
                        )}
                        m ago
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                  <Badge variant="outline" className="text-xs">
                    {user.role}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Cursors */}
      {users
        .filter(
          (user) => user.isActive && user.cursor && user.id !== currentUserId
        )
        .map((user) => (
          <div
            key={user.id}
            className="absolute pointer-events-none z-50"
            style={{
              left: user.cursor!.x,
              top: user.cursor!.y,
              transform: "translate(-2px, -2px)",
            }}
          >
            <MousePointer className="w-4 h-4" style={{ color: user.color }} />
            <div
              className="absolute top-4 left-2 px-2 py-1 rounded text-white text-xs whitespace-nowrap"
              style={{ backgroundColor: user.color }}
            >
              {user.name}
            </div>
          </div>
        ))}

      {/* Comments Overlay */}
      {showComments && (
        <>
          {/* Existing Comments */}
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="absolute z-40"
              style={{ left: comment.x, top: comment.y }}
            >
              <CommentMarker comment={comment} />
            </div>
          ))}

          {/* New Comment Input */}
          {commentPosition && (
            <div
              className="absolute z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-3 w-64"
              style={{ left: commentPosition.x, top: commentPosition.y }}
            >
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full p-2 border border-gray-300 rounded text-sm resize-none"
                rows={3}
                autoFocus
              />
              <div className="flex justify-end space-x-2 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCommentPosition(null)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() =>
                    addComment(commentPosition.x, commentPosition.y, newComment)
                  }
                  disabled={!newComment.trim()}
                >
                  <Send className="w-4 h-4 mr-1" />
                  Comment
                </Button>
              </div>
            </div>
          )}

          {/* Click overlay for adding comments */}
          <div
            className="absolute inset-0 z-30"
            onClick={handleCanvasClick}
            style={{ cursor: showComments ? "crosshair" : "default" }}
          />
        </>
      )}
    </>
  );
}

function CommentMarker({ comment }: { comment: Comment }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const user = { name: "Current User", color: "#3B82F6" }; // Mock user

  return (
    <div className="relative">
      <div
        className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs cursor-pointer"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <MessageCircle className="w-3 h-3" />
      </div>

      {showTooltip && (
        <div className="absolute bottom-8 left-0 bg-white rounded-lg shadow-lg border border-gray-200 p-3 w-64 z-50">
          <div className="flex items-center space-x-2 mb-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
              style={{ backgroundColor: user.color }}
            >
              {user.name[0]}
            </div>
            <span className="font-medium text-sm">{user.name}</span>
            <span className="text-xs text-gray-500">
              {comment.timestamp.toLocaleTimeString()}
            </span>
          </div>
          <p className="text-sm text-gray-700">{comment.content}</p>
        </div>
      )}
    </div>
  );
}
