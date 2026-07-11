# Development shell for NixOS: `nix-shell` then `npm install` / `npm run dev`
{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  packages = [ pkgs.nodejs_22 ];
}
