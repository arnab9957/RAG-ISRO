/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FC } from "react";
import { motion } from "motion/react";
import { AgentAction, AgentRole } from "../types";
import { CheckCircle2, CircleDashed, AlertTriangle, ShieldCheck, Cpu, Search } from "lucide-react";

interface AgentActionItemProps {
  action: AgentAction;
}

const roleIcons = {
  [AgentRole.EXECUTOR]: <Search className="w-4 h-4" />,
  [AgentRole.CRITIC]: <Cpu className="w-4 h-4" />,
  [AgentRole.VALIDATOR]: <ShieldCheck className="w-4 h-4" />,
};

const statusIcons = {
  active: <CircleDashed className="w-4 h-4 animate-spin text-blue-500" />,
  completed: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
  failed: <AlertTriangle className="w-4 h-4 text-rose-500" />,
  pending: <CircleDashed className="w-4 h-4 text-gray-400" />,
};

const AgentActionItem: FC<AgentActionItemProps> = ({ action }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-3 mb-3 bg-zinc-900/50 border border-zinc-800 rounded-lg backdrop-blur-sm"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-zinc-800 rounded text-zinc-400">
            {roleIcons[action.role]}
          </div>
          <span className="text-xs font-bold tracking-widest uppercase text-zinc-500">
            {action.role}
          </span>
        </div>
        <div>
          {statusIcons[action.status]}
        </div>
      </div>
      
      <p className="text-sm text-zinc-200 mb-2">{action.action}</p>
      
      {action.output && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="p-2 bg-black/40 rounded border border-zinc-800/50 text-xs font-mono text-zinc-400 overflow-hidden"
        >
          {action.output.length > 200 ? `${action.output.substring(0, 200)}...` : action.output}
        </motion.div>
      )}
      
      <div className="mt-2 flex justify-end text-[10px] font-mono text-zinc-600">
        {new Date(action.timestamp).toLocaleTimeString()}
      </div>
    </motion.div>
  );
};

export default AgentActionItem;
