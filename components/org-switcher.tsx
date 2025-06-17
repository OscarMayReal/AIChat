"use client"

import * as React from "react"
import { ChevronDown, Plus } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function TeamSwitcher({
  teams,
}: {
  teams: {
    logo: string
    name: string
    memberCount: number
    id: string | undefined
  }[]
}) {
    if (teams == null) {
        teams = []
    }
  const [activeTeam, setActiveTeam] = React.useState(teams[0])

  if (!activeTeam) {
    return null
  }

  return (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
        <div className="w-fit px-1.5 flex items-center gap-2">
            <div className="size-4 rounded-md">
                <img src={activeTeam.logo} className="size-4" />
            </div>
            <span className="truncate font-16">{activeTeam.name}</span>
            <ChevronDown className="opacity-50" size={16} />
        </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent
        className="w-64 rounded-lg"
        align="start"
        side="bottom"
        sideOffset={4}
        >
        <DropdownMenuLabel className="text-muted-foreground text-xs">
            Teams
        </DropdownMenuLabel>
        {teams.map((team, index) => (
            <DropdownMenuItem
            key={team.name}
            onClick={() => setActiveTeam(team)}
            className="gap-2 p-2"
            >
            <div className="size-4 rounded-md">
                <img src={team.logo} className="size-4" />
            </div>
            {team.name}
            <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
            </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2 p-2">
            <div className="bg-background flex size-6 items-center justify-center rounded-md border">
            <Plus className="size-4" />
            </div>
            <div className="text-muted-foreground font-medium">Add team</div>
        </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
  )
}
