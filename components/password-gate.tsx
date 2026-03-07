"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, Unlock } from "lucide-react";

interface PasswordGateProps {
  password: string;
  moduleId: string;
  moduleName: string;
  children: React.ReactNode;
}

const STORAGE_KEY_PREFIX = "rt_academy_password_";

export function PasswordGate({
  password,
  moduleId,
  moduleName,
  children,
}: PasswordGateProps) {
  const [enteredPassword, setEnteredPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storageKey = `${STORAGE_KEY_PREFIX}${moduleId}`;
    const savedPassword = localStorage.getItem(storageKey);
    if (savedPassword === password) {
      setIsUnlocked(true);
    }
  }, [moduleId, password]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPassword === password) {
      setIsUnlocked(true);
      setError(false);
      const storageKey = `${STORAGE_KEY_PREFIX}${moduleId}`;
      localStorage.setItem(storageKey, password);
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  if (!mounted) {
    return null;
  }

  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-md border-orange-500/30">
        <CardHeader>
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-orange-500/10 p-4">
              <Lock className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          <CardTitle className="text-center text-2xl">
            Password Required
          </CardTitle>
          <CardDescription className="text-center">
            This module requires a password. Enter it to access{" "}
            <strong>{moduleName}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Enter password"
                value={enteredPassword}
                onChange={(e) => setEnteredPassword(e.target.value)}
                className={error ? "border-red-500" : ""}
              />
              {error && (
                <p className="text-sm text-red-400">
                  Incorrect password. Please try again.
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Need access? Contact{" "}
                <a
                  href="https://twitter.com/redditech"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-500 hover:underline"
                >
                  @redditech
                </a>
              </p>
            </div>
            <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-slate-900">
              <Unlock className="mr-2 h-4 w-4" />
              Unlock Module
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
