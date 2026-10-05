import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Minimize, 
  RotateCcw, 
  Download, 
  X, 
  GitFork, 
  ChevronsRightLeft, 
  ChevronsLeftRight, 
  Search,
  Sparkles,
  Layers,
  FileDown
} from 'lucide-react';
import { MindMap, SubjectId } from '../types';

export interface MindMapNode {
  id: string;
  name: string;
  depth: number;
  children?: MindMapNode[];
  _children?: MindMapNode[]; // Storage for collapsed children
  isCollapsed?: boolean;
}

interface InteractiveMindMapProps {
  mindmap: MindMap;
  subjectName?: string;
  subjectColor?: string;
  onClose: () => void;
}

// Convert markdown text to hierarchical tree structure
export function parseMarkdownToTree(title: string, markdown?: string): MindMapNode {
  const root: MindMapNode = {
    id: 'node-root',
    name: title,
    depth: 0,
    children: []
  };

  if (!markdown || !markdown.trim()) {
    return root;
  }

  const lines = markdown.split('\n').filter(line => line.trim().length > 0);
  
  // Tracking current parents at each depth: depth 0 is root
  const currentStack: MindMapNode[] = [root];

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();

    let depth = 1;
    let cleanText = line;

    if (line.startsWith('# ')) {
      // Overwrite root or treat as main theme
      cleanText = line.replace(/^#\s+/, '').trim();
      root.name = cleanText;
      return;
    } else if (line.startsWith('## ')) {
      depth = 1;
      cleanText = line.replace(/^##\s+/, '').trim();
    } else if (line.startsWith('### ')) {
      depth = 2;
      cleanText = line.replace(/^###\s+/, '').trim();
    } else if (line.startsWith('#### ')) {
      depth = 3;
      cleanText = line.replace(/^####\s+/, '').trim();
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      // Check indent level of rawLine
      const leadingSpaces = rawLine.search(/\S/);
      const extraDepth = Math.floor(leadingSpaces / 2);
      depth = Math.max(2, Math.min(5, 3 + extraDepth));
      cleanText = line.replace(/^[-*]\s+/, '').trim();
    } else {
      // Regular paragraph or note
      depth = 2;
    }

    const newNode: MindMapNode = {
      id: `node-${idx}-${Math.random().toString(36).substring(2, 7)}`,
      name: cleanText,
      depth,
      children: []
    };

    // Find closest parent with depth < current depth
    while (currentStack.length > 1 && currentStack[currentStack.length - 1].depth >= depth) {
      currentStack.pop();
    }

    const parent = currentStack[currentStack.length - 1];
    if (!parent.children) {
      parent.children = [];
    }
    parent.children.push(newNode);
    currentStack.push(newNode);
  });

  return root;
}

export const InteractiveMindMap: React.FC<InteractiveMindMapProps> = ({
  mindmap,
  subjectName = 'المنهاج السوري 2026',
  subjectColor = '#4f46e5',
  onClose
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [treeData, setTreeData] = useState<MindMapNode>(() => 
    parseMarkdownToTree(mindmap.title, mindmap.content)
  );
  const [totalNodeCount, setTotalNodeCount] = useState(0);

  // Initialize tree data when mindmap changes
  useEffect(() => {
    const parsed = parseMarkdownToTree(mindmap.title, mindmap.content);
    setTreeData(parsed);
  }, [mindmap.title, mindmap.content]);

  // Count total nodes
  useEffect(() => {
    let count = 0;
    const countNodes = (n: MindMapNode) => {
      count++;
      if (n.children) n.children.forEach(countNodes);
      if (n._children) n._children.forEach(countNodes);
    };
    countNodes(treeData);
    setTotalNodeCount(count);
  }, [treeData]);

  // Toggle node collapse state
  const handleToggleNode = useCallback((nodeId: string) => {
    setTreeData(prevTree => {
      // Deep clone to trigger render
      const clone = JSON.parse(JSON.stringify(prevTree)) as MindMapNode;

      const toggle = (curr: MindMapNode): boolean => {
        if (curr.id === nodeId) {
          if (curr.children && curr.children.length > 0) {
            // Collapse
            curr._children = curr.children;
            curr.children = undefined;
            curr.isCollapsed = true;
          } else if (curr._children && curr._children.length > 0) {
            // Expand
            curr.children = curr._children;
            curr._children = undefined;
            curr.isCollapsed = false;
          }
          return true;
        }

        if (curr.children) {
          for (const child of curr.children) {
            if (toggle(child)) return true;
          }
        }
        if (curr._children) {
          for (const child of curr._children) {
            if (toggle(child)) return true;
          }
        }
        return false;
      };

      toggle(clone);
      return clone;
    });
  }, []);

  // Collapse or Expand All
  const handleToggleAll = (expand: boolean) => {
    setTreeData(prevTree => {
      const clone = JSON.parse(JSON.stringify(prevTree)) as MindMapNode;

      const processNode = (n: MindMapNode) => {
        if (expand) {
          if (n._children && n._children.length > 0) {
            n.children = n._children;
            n._children = undefined;
          }
          n.isCollapsed = false;
        } else {
          // Collapse all except root
          if (n.depth > 0 && n.children && n.children.length > 0) {
            n._children = n.children;
            n.children = undefined;
            n.isCollapsed = true;
          }
        }

        if (n.children) n.children.forEach(processNode);
        if (n._children) n._children.forEach(processNode);
      };

      processNode(clone);
      return clone;
    });
  };

  // Zoom handlers
  const handleZoomIn = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(300)
        .call(zoomBehaviorRef.current.scaleBy, 1.25);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(300)
        .call(zoomBehaviorRef.current.scaleBy, 0.8);
    }
  };

  const handleFitView = useCallback(() => {
    if (!svgRef.current || !gRef.current || !zoomBehaviorRef.current) return;

    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);
    const bounds = (g.node() as SVGGraphicsElement).getBBox();
    const parent = (svg.node() as SVGGraphicsElement).parentElement;

    if (!parent || bounds.width === 0 || bounds.height === 0) return;

    const fullWidth = parent.clientWidth || 1000;
    const fullHeight = parent.clientHeight || 700;

    const padding = 80;
    const midX = bounds.x + bounds.width / 2;
    const midY = bounds.y + bounds.height / 2;

    const scale = Math.min(
      (fullWidth - padding * 2) / bounds.width,
      (fullHeight - padding * 2) / bounds.height,
      1.2
    );

    const targetScale = Math.max(0.4, scale);
    const translate = [
      fullWidth / 2 - targetScale * midX,
      fullHeight / 2 - targetScale * midY
    ];

    svg.transition()
      .duration(600)
      .call(
        zoomBehaviorRef.current.transform,
        d3.zoomIdentity.translate(translate[0], translate[1]).scale(targetScale)
      );
  }, []);

  // Export as SVG
  const handleDownloadSVG = () => {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgRef.current);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `خريطة_${mindmap.title.replace(/\s+/g, '_')}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export as PNG
  const handleDownloadPNG = () => {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgRef.current);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const URLObject = window.URL || window.webkitURL || window;
    const blobURL = URLObject.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = 2; // High-resolution output
      canvas.width = (svgRef.current?.clientWidth || 1200) * scale;
      canvas.height = (svgRef.current?.clientHeight || 800) * scale;
      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle = '#0f172a';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.scale(scale, scale);
        context.drawImage(image, 0, 0);

        const a = document.createElement('a');
        a.download = `خريطة_${mindmap.title.replace(/\s+/g, '_')}.png`;
        a.href = canvas.toDataURL('image/png');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      URLObject.revokeObjectURL(blobURL);
    };
    image.src = blobURL;
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Keyboard shortcut ESC to exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.fullscreenElement) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Main D3 Rendering logic
  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;

    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);

    // Setup Zoom Behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    zoomBehaviorRef.current = zoom;
    svg.call(zoom);

    // Prepare Hierarchy
    const rootHierarchy = d3.hierarchy<MindMapNode>(treeData, d => d.children);

    // Calculate node dimensions
    const calculateNodeWidth = (name: string, depth: number) => {
      const length = name.length;
      if (depth === 0) return Math.min(320, Math.max(180, length * 11 + 40));
      if (depth === 1) return Math.min(300, Math.max(160, length * 10 + 36));
      return Math.min(280, Math.max(130, length * 9 + 30));
    };

    const nodeHeight = 44;
    const horizontalSpacing = 300;
    const verticalSpacing = 68;

    // D3 Tree Layout
    const treeLayout = d3.tree<MindMapNode>()
      .nodeSize([verticalSpacing, horizontalSpacing])
      .separation((a, b) => (a.parent === b.parent ? 1.1 : 1.35));

    const rootLayout = treeLayout(rootHierarchy);

    // Nodes and Links
    const nodes = rootLayout.descendants();
    const links = rootLayout.links();

    // Clear previous elements
    g.selectAll('.mindmap-link').remove();
    g.selectAll('.mindmap-node').remove();

    // Color helpers based on depth and NotebookLM aesthetic
    const getNodeTheme = (depth: number) => {
      if (depth === 0) {
        return {
          bg: '#064e3b',
          border: '#10b981',
          text: '#ecfdf5',
          glow: 'rgba(16, 185, 129, 0.4)',
          badgeBg: '#047857'
        };
      }
      if (depth === 1) {
        return {
          bg: '#1e293b',
          border: '#6366f1',
          text: '#e0e7ff',
          glow: 'rgba(99, 102, 241, 0.3)',
          badgeBg: '#4338ca'
        };
      }
      if (depth === 2) {
        return {
          bg: '#162032',
          border: '#0ea5e9',
          text: '#e0f2fe',
          glow: 'rgba(14, 165, 233, 0.25)',
          badgeBg: '#0369a1'
        };
      }
      return {
        bg: '#0f172a',
        border: '#475569',
        text: '#cbd5e1',
        glow: 'rgba(100, 116, 139, 0.2)',
        badgeBg: '#334155'
      };
    };

    // Draw Smooth Cubic Bezier Curves (NotebookLM Style)
    // Horizontal layout: source.y is X-coordinate, source.x is Y-coordinate
    const linkGroup = g.append('g').attr('class', 'mindmap-link');

    linkGroup.selectAll('path')
      .data(links)
      .join('path')
      .attr('fill', 'none')
      .attr('stroke', (d) => {
        if (d.source.depth === 0) return '#10b98188';
        if (d.source.depth === 1) return '#6366f188';
        return '#38444d';
      })
      .attr('stroke-width', (d) => Math.max(1.8, 3.2 - d.source.depth * 0.5))
      .attr('stroke-linecap', 'round')
      .attr('d', (d) => {
        const sourceWidth = calculateNodeWidth(d.source.data.name, d.source.depth);
        const sourceX = d.source.y + sourceWidth;
        const sourceY = d.source.x;
        const targetX = d.target.y;
        const targetY = d.target.x;

        const deltaX = targetX - sourceX;
        const curvature = Math.max(40, deltaX * 0.5);

        return `M ${sourceX} ${sourceY} C ${sourceX + curvature} ${sourceY}, ${targetX - curvature} ${targetY}, ${targetX} ${targetY}`;
      });

    // Function to re-render all links when nodes move dynamically
    const updateAllLinks = () => {
      linkGroup.selectAll<SVGPathElement, d3.HierarchyPointLink<MindMapNode>>('path')
        .attr('d', (d) => {
          const sourceWidth = calculateNodeWidth(d.source.data.name, d.source.depth);
          const sourceX = d.source.y + sourceWidth;
          const sourceY = d.source.x;
          const targetX = d.target.y;
          const targetY = d.target.x;

          const deltaX = targetX - sourceX;
          const curvature = Math.max(30, Math.abs(deltaX) * 0.5);

          return `M ${sourceX} ${sourceY} C ${sourceX + curvature} ${sourceY}, ${targetX - curvature} ${targetY}, ${targetX} ${targetY}`;
        });
    };

    // Node Interactive Drag & Reposition Behavior
    let totalDragDistance = 0;
    const dragBehavior = d3.drag<SVGGElement, d3.HierarchyPointNode<MindMapNode>>()
      .on('start', function(event, d) {
        totalDragDistance = 0;
        d3.select(this).raise();
        d3.select(this).style('cursor', 'grabbing');
        d3.select(this).select('rect')
          .attr('stroke', '#38bdf8')
          .attr('stroke-width', 2.8)
          .style('filter', 'drop-shadow(0 6px 20px rgba(56, 189, 248, 0.5))');
      })
      .on('drag', function(event, d) {
        totalDragDistance += Math.abs(event.dx) + Math.abs(event.dy);
        // In horizontal layout, d.y is X-position and d.x is Y-position
        d.y += event.dx;
        d.x += event.dy;

        d3.select(this).attr('transform', `translate(${d.y}, ${d.x - nodeHeight / 2})`);
        updateAllLinks();
      })
      .on('end', function(event, d) {
        d3.select(this).style('cursor', 'grab');
        const theme = getNodeTheme(d.depth);
        const isMatch = searchQuery && d.data.name.toLowerCase().includes(searchQuery.toLowerCase());
        d3.select(this).select('rect')
          .attr('stroke', isMatch ? '#facc15' : theme.border)
          .attr('stroke-width', d.depth === 0 ? 2.5 : 1.8)
          .style('filter', `drop-shadow(0 4px 12px ${theme.glow})`);
      });

    // Draw Nodes (Capsules)
    const nodeGroup = g.append('g').attr('class', 'mindmap-node');

    const nodeSelection = nodeGroup.selectAll('g')
      .data(nodes)
      .join('g')
      .attr('transform', d => `translate(${d.y}, ${d.x - nodeHeight / 2})`)
      .style('cursor', 'grab')
      .style('touch-action', 'none')
      .call(dragBehavior as any);

    // Node Capsule (Rounded Rectangle)
    nodeSelection.append('rect')
      .attr('width', d => calculateNodeWidth(d.data.name, d.depth))
      .attr('height', nodeHeight)
      .attr('rx', 10)
      .attr('ry', 10)
      .attr('fill', d => {
        const theme = getNodeTheme(d.depth);
        const isMatch = searchQuery && d.data.name.toLowerCase().includes(searchQuery.toLowerCase());
        return isMatch ? '#854d0e' : theme.bg;
      })
      .attr('stroke', d => {
        const theme = getNodeTheme(d.depth);
        const isMatch = searchQuery && d.data.name.toLowerCase().includes(searchQuery.toLowerCase());
        return isMatch ? '#facc15' : theme.border;
      })
      .attr('stroke-width', d => (d.depth === 0 ? 2.5 : 1.8))
      .style('filter', d => {
        const theme = getNodeTheme(d.depth);
        return `drop-shadow(0 4px 12px ${theme.glow})`;
      })
      .on('click', (event, d) => {
        if (totalDragDistance > 6) return; // Prevent toggle if user dragged the node
        handleToggleNode(d.data.id);
      });

    // Node Text
    nodeSelection.append('text')
      .attr('x', d => calculateNodeWidth(d.data.name, d.depth) / 2)
      .attr('y', nodeHeight / 2 + 5)
      .attr('text-anchor', 'middle')
      .attr('fill', d => {
        const isMatch = searchQuery && d.data.name.toLowerCase().includes(searchQuery.toLowerCase());
        if (isMatch) return '#fef08a';
        return getNodeTheme(d.depth).text;
      })
      .attr('font-size', d => (d.depth === 0 ? '14px' : d.depth === 1 ? '13px' : '12px'))
      .attr('font-weight', d => (d.depth <= 1 ? '700' : '600'))
      .attr('font-family', "'Cairo', sans-serif")
      .style('user-select', 'none')
      .style('pointer-events', 'none')
      .text(d => d.data.name);

    // Expand / Collapse Circular Button on the Right Edge
    const expandableNodes = nodeSelection.filter(
      d => !!((d.data.children && d.data.children.length > 0) || (d.data._children && d.data._children.length > 0))
    );

    const togglePill = expandableNodes.append('g')
      .attr('transform', d => {
        const width = calculateNodeWidth(d.data.name, d.depth);
        return `translate(${width}, ${nodeHeight / 2})`;
      })
      .on('click', (e, d) => {
        e.stopPropagation();
        handleToggleNode(d.data.id);
      });

    // Pill background
    togglePill.append('circle')
      .attr('r', 11)
      .attr('fill', d => {
        const theme = getNodeTheme(d.depth);
        return d.data.isCollapsed ? theme.border : '#1e293b';
      })
      .attr('stroke', d => getNodeTheme(d.depth).border)
      .attr('stroke-width', 1.5)
      .style('transition', 'all 0.2s ease');

    // Plus or Minus icon
    togglePill.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', d => d.data.isCollapsed ? '#ffffff' : '#94a3b8')
      .attr('font-size', '13px')
      .attr('font-weight', 'bold')
      .style('pointer-events', 'none')
      .text(d => {
        const hasChildren = d.data.children && d.data.children.length > 0;
        return hasChildren ? '−' : '+';
      });

    // Children count badge for collapsed nodes
    const collapsedNodes = expandableNodes.filter(d => !!d.data.isCollapsed);
    collapsedNodes.append('text')
      .attr('x', d => calculateNodeWidth(d.data.name, d.depth) + 16)
      .attr('y', nodeHeight / 2 + 4)
      .attr('fill', '#94a3b8')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('font-family', "'Cairo', sans-serif")
      .style('pointer-events', 'none')
      .text(d => {
        const count = d.data._children ? d.data._children.length : 0;
        return `(${count})`;
      });

  }, [treeData, searchQuery, handleToggleNode]);

  // Initial fit view
  useEffect(() => {
    const timer = setTimeout(() => {
      handleFitView();
    }, 150);
    return () => clearTimeout(timer);
  }, [handleFitView]);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col bg-[#0b0f17] text-slate-100 overflow-hidden font-sans select-none"
      dir="rtl"
    >
      {/* Top Header Bar - NotebookLM Style */}
      <div className="h-16 px-4 sm:px-6 bg-[#0f172a]/95 backdrop-blur-md border-b border-slate-800 flex items-center justify-between gap-4 z-20 shadow-md">
        
        {/* Title and Subject Badges */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-sm">
            <GitFork className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black text-white truncate">
                {mindmap.title}
              </h1>
              <span 
                className="text-[10px] font-bold px-2 py-0.5 rounded shrink-0 hidden sm:inline-block"
                style={{ backgroundColor: `${subjectColor}25`, color: subjectColor }}
              >
                {subjectName}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <Sparkles className="w-3 h-3" />
                <span>المنهج السوري 2026</span>
              </span>
              <span>•</span>
              <span>{totalNodeCount} عقد ومفاهيم</span>
              {mindmap.unit && (
                <>
                  <span>•</span>
                  <span className="truncate">{mindmap.unit}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Quick Search */}
          <div className="relative hidden md:block">
            <input
              type="text"
              placeholder="بحث في المفاهيم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-44 lg:w-56 pl-3 pr-8 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Expand / Collapse All */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => handleToggleAll(true)}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="توسيع كافة الفروع"
            >
              <ChevronsLeftRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleToggleAll(false)}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="طي كافة الفروع"
            >
              <ChevronsRightLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors hidden sm:flex items-center justify-center"
            title={isFullscreen ? 'إلغاء ملء الشاشة' : 'ملء الشاشة'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          {/* Close Modal */}
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors flex items-center justify-center"
            title="إغلاق الخريطة (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      </div>

      {/* SVG Canvas Area with Subtle Dot Grid Background */}
      <div className="relative flex-1 w-full h-full bg-[#0d121c] overflow-hidden cursor-grab active:cursor-grabbing">
        
        {/* Subtle decorative dot pattern */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
          <pattern id="mindmap-dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill="#94a3b8" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#mindmap-dots)" />
        </svg>

        {/* Main Interactive D3 SVG */}
        <svg 
          ref={svgRef} 
          className="w-full h-full block select-none"
        >
          <g ref={gRef} />
        </svg>

        {/* Floating Controls (Bottom Right Capsule - NotebookLM style) */}
        <div className="absolute bottom-6 right-6 z-30 flex flex-col items-center bg-[#0f172a]/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-1.5 shadow-2xl gap-1">
          
          {/* Fit View / Re-Center */}
          <button
            onClick={handleFitView}
            className="p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors flex items-center justify-center"
            title="إعادة التوسيط والملاءمة للنافذة"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Zoom In */}
          <button
            onClick={handleZoomIn}
            className="p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors flex items-center justify-center"
            title="تكبير (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {/* Zoom Out */}
          <button
            onClick={handleZoomOut}
            className="p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors flex items-center justify-center"
            title="تصغير (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <div className="w-6 h-px bg-slate-700/80 my-0.5" />

          {/* Download as PNG */}
          <button
            onClick={handleDownloadPNG}
            className="p-2.5 rounded-xl text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors flex items-center justify-center"
            title="تنزيل كصورة PNG عالية الدقة"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Download as SVG */}
          <button
            onClick={handleDownloadSVG}
            className="p-2.5 rounded-xl text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors flex items-center justify-center"
            title="تصدير كملف متجهي SVG"
          >
            <FileDown className="w-4 h-4" />
          </button>
        </div>

        {/* Legend / Guide Indicator (Bottom Left) */}
        <div className="absolute bottom-6 left-6 z-20 hidden md:flex items-center gap-3 px-3.5 py-2 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-800/80 text-[11px] text-slate-400 shadow-lg">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>المفهوم الرئيسي</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <span>المحاور والوحدات</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            <span>المعايير والتفاصيل</span>
          </div>
          <span>•</span>
          <span className="text-slate-400">انقر للطي/الفتح • اسحب أي عقدة لتغيير موقعها بحرية • اسحب الخلفية للتحريك</span>
        </div>

      </div>
    </div>
  );
};
