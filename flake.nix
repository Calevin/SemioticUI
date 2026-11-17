{
  description = "Development environment for Semiotic UI Kit";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs =
    { self, nixpkgs }:
    let
      supportedSystems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];
      forEachSystem = nixpkgs.lib.genAttrs supportedSystems;
    in
    {
      devShells = forEachSystem (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
        in
        {
          # Usamos mkShellNoCC porque la libreria core y Astro operan en JavaScript puro sin compilacion nativa C/C++
          default = pkgs.mkShellNoCC {
            packages = with pkgs; [
              nodejs_22
            ];

            # Evita telemetria de Astro en entornos locales de desarrollo
            ASTRO_TELEMETRY_DISABLED = "1";

            shellHook = ''
              echo "Semiotic UI dev shell ready (Node $(node --version))."
            '';
          };
        }
      );
    };
}
