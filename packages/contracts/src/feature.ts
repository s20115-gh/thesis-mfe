/**
 * What the shell gives every feature module. In the monolith this is passed
 * as props; in the federated builds it crosses the remote boundary, so it is
 * the only API between the shell and a remote. Keep it small.
 */
export type FeatureProps = {
  /** URL prefix the feature is mounted under, e.g. "/venues". */
  basePath: string
}
