// Dependency rules for the whole repo, checked by `pnpm lint:deps`.
//
// The main rule mirrors the micro-frontend boundary inside the monolith:
// feature modules never import each other, so the same code can be split
// into separate remotes without changes. Features talk to each other only
// through URLs, props from the shell and the shared Supabase session.
//
// Later this config is also used to measure fan-in / fan-out (coupling).

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-cross-feature-imports',
      severity: 'error',
      comment:
        'A feature must not import another feature. Link to it by URL instead, ' +
        'or move shared code to packages/ui, packages/data or packages/contracts.',
      from: { path: '^packages/features/([^/]+)/' },
      to: {
        path: '^packages/features/',
        pathNot: '^packages/features/$1/',
      },
    },
    {
      name: 'no-unresolvable-imports',
      severity: 'error',
      comment:
        'This import cannot be resolved. Importing a workspace package that is not ' +
        'declared in package.json (e.g. another feature) ends up here.',
      from: {},
      to: { couldNotResolve: true },
    },
    {
      name: 'features-not-to-apps',
      severity: 'error',
      comment:
        'A feature must not import code from an app (the monolith or the MFE shell). ' +
        'Everything it needs comes in through FeatureProps or the shared packages.',
      from: { path: '^packages/features/' },
      to: { path: '^apps/' },
    },
    {
      name: 'shared-packages-not-to-features-or-apps',
      severity: 'error',
      comment:
        'packages/ui, data and contracts are used by every feature, so they must not ' +
        'depend on any feature or app.',
      from: { path: '^packages/(ui|data|contracts)/' },
      to: { path: '^(packages/features|apps)/' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    // Workspace packages are symlinked into node_modules; resolve them to
    // their real folders so `@thesis/feature-x` counts as packages/features/x.
    preserveSymlinks: false,
    // Type-only imports count too: they couple features just the same.
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.base.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'default'],
      extensions: ['.ts', '.tsx', '.js', '.mjs'],
    },
    exclude: { path: '(^|/)(dist|node_modules|\\.mf)/' },
  },
}
