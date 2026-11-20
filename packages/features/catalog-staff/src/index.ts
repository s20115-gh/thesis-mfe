// Public entry of the Catalog and staff feature. The only export is the default
// <Routes/> component: the monolith loads it with React.lazy, and a remote
// exposes it through Module Federation. Nothing else may be imported from
// outside this package.
export { default } from './Routes.tsx'
