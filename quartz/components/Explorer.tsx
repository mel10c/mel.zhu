import { QuartzComponentConstructor, QuartzComponentProps } from "./types"
import explorerStyle from "./styles/explorer.scss"

// @ts-ignore
import script from "./scripts/explorer.inline"
import { ExplorerNode, FileNode, Options } from "./ExplorerNode"

// Options interface defined in `ExplorerNode` to avoid circular dependency
const defaultOptions = {
  title: "Explorer",
  folderClickBehavior: "collapse",
  folderDefaultState: "collapsed",
  useSavedState: true,
  // Sort order: folders first, then files. Sort folders and files alphabetically
  sortFn: (a, b) => {
    if ((!a.file && !b.file) || (a.file && b.file)) {
      return a.name.localeCompare(b.name)
    }
    if (a.file && !b.file) {
      return 1
    } else {
      return -1
    }
  },
  filterFn: (node) => node.name !== "tags",
  order: ["filter", "map", "sort"],
} satisfies Options

export default ((userOpts?: Partial<Options>) => {
  function Explorer({ allFiles, displayClass, fileData }: QuartzComponentProps) {
    // Parse config
    const opts: Options = { ...defaultOptions, ...userOpts }

    // Construct tree from allFiles
    const fileTree = new FileNode("")
    allFiles.forEach((file) => fileTree.add(file, 1))

    /**
     * Keys of this object must match corresponding function name of `FileNode`,
     * while values must be the argument that will be passed to the function.
     *
     * e.g. entry for FileNode.sort: `sort: opts.sortFn` (value is sort function from options)
     */
    const functions = {
      map: opts.mapFn,
      sort: opts.sortFn,
      filter: opts.filterFn,
    }

    // Execute all functions (sort, filter, map) that were provided (if none were provided, only default "sort" is applied)
    if (opts.order) {
      // Order is important, use loop with index instead of order.map()
      for (let i = 0; i < opts.order.length; i++) {
        const functionName = opts.order[i]
        if (functions[functionName]) {
          // for every entry in order, call matching function in FileNode and pass matching argument
          // e.g. i = 0; functionName = "filter"
          // converted to: (if opts.filterFn) => fileTree.filter(opts.filterFn)

          // @ts-ignore
          // typescript cant statically check these dynamic references, so manually make sure reference is valid and ignore warning
          fileTree[functionName].call(fileTree, functions[functionName])
        }
      }
    }

    // Get all folders of tree. Initialize with collapsed state
    const folders = fileTree.getFolderPaths(opts.folderDefaultState === "collapsed")

    // Stringify to pass json tree as data attribute ([data-tree])
    const jsonTree = JSON.stringify(folders)

    return (
      <div class={`explorer ${displayClass}`}>
        <button
          type="button"
          id="explorer"
          data-behavior={opts.folderClickBehavior}
          data-collapsed={opts.folderDefaultState}
          data-savestate={opts.useSavedState}
          data-tree={jsonTree}
        >
          <h3>{opts.title}</h3>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="5 8 14 8"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="fold"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
        <div id="explorer-content">
          <ul class="overflow" id="explorer-ul">
            <ExplorerNode node={fileTree} opts={opts} fileData={fileData} />
            <div id="explorer-end" />
          </ul>
        </div>
      </div>
    )
  }
  Explorer.css = explorerStyle
  Explorer.afterDOMLoaded = script
  return Explorer
}) satisfies QuartzComponentConstructor
