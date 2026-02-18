export { DependencyBrowser } from './components/dependency-browser'
export {
  useDependencyBrowser,
  type UseDependencyBrowserResult,
} from './hooks/use-dependency-browser'
export {
  filterDependencyGroups,
  groupDependenciesByCategory,
  replaceDependencySelection,
  toggleDependencySelection,
  type DependencyGroup,
} from './model/dependency-browser'
export { resolveDependencyPreviewDiff } from './model/dependency-preview-diff'
