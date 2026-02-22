'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { registerSchema, type RegisterFormData } from '@/lib/auth-schemas';
import { Mail, Lock, User, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    full_name: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const validation = registerSchema.safeParse(formData);
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      setIsLoading(false);
      return;
    }

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: formData.full_name,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-8 rounded-xl border border-gold/20 bg-card/80 p-8 backdrop-blur-sm">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <span className="text-2xl">✓</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Check your email</h1>
            <p className="mt-2 text-foreground-muted">
              We&apos;ve sent a confirmation link to <span className="text-gold">{formData.email}</span>
            </p>
          </div>
          <p className="text-center text-sm text-foreground-muted">
            <a href="/login" className="text-gold hover:underline">
              Back to Login
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-gold/20 bg-card/80 p-8 backdrop-blur-sm">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gold/10">
            <span className="text-2xl font-bold text-gold">AI</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Create Account</h1>
          <p className="mt-2 text-foreground-muted">Join the inventory management system</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg bg-danger/10 p-3 text-sm text-danger border border-danger/20">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="full_name" className="mb-2 block text-sm font-medium text-foreground">
                Full Name
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                  <User className="h-5 w-5 text-foreground-muted" />
                </div>
                <input
                  id="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full rounded-lg border border-border bg-input py-3 pl-10 pr-4 text-foreground placeholder:text-foreground-muted focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-foreground">
                Email
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                  <Mail className="h-5 w-5 text-foreground-muted" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-lg border border-border bg-input py-3 pl-10 pr-4 text-foreground placeholder:text-foreground-muted focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-foreground">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                  <Lock className="h-5 w-5 text-foreground-muted" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full rounded-lg border border-border bg-input py-3 pl-10 pr-4 text-foreground placeholder:text-foreground-muted focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-gold py-3 font-semibold text-background transition-all hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Creating account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>

          <p className="text-center text-sm text-foreground-muted">
            Already have an account?{' '}
            <a href="/login" className="text-gold hover:underline">
              Sign In
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
