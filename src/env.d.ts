/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    runtime?: {
      env?: {
        DEPLOY_TARGET?: string;
        DB?: unknown;
        BUCKET?: unknown;
        JWT_SECRET?: string;
        GITHUB_CLIENT_ID?: string;
        GITHUB_CLIENT_SECRET?: string;
        GOOGLE_CLIENT_ID?: string;
        GOOGLE_CLIENT_SECRET?: string;
      };
    };
    user?: {
      sub: string;
      username: string;
      name: string;
      avatar: string;
    } | null;
  }
}
