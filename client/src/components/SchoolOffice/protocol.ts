export type CharacterSpriteSet = {
  down: string[][][];
  up: string[][][];
  right: string[][][];
};

export type FurnitureAsset = {
  id: string;
  name: string;
  label: string;
  category: string;
  file: string;
  width: number;
  height: number;
  footprintW: number;
  footprintH: number;
  isDesk: boolean;
  canPlaceOnWalls: boolean;
  groupId?: string;
  canPlaceOnSurfaces?: boolean;
  backgroundTiles?: number;
  orientation?: string;
  state?: string;
  mirrorSide?: boolean;
  rotationScheme?: string;
  animationGroup?: string;
  frame?: number;
};

export type ExistingAgentsMessage = {
  type: 'existingAgents';
  agents: number[];
  agentMeta: Record<string, { palette: number; hueShift: number }>;
  folderNames: Record<string, string>;
  externalAgents: Record<string, boolean>;
};

export type PixelOfficeServerMessage =
  | { type: 'providerCapabilities'; readingTools: string[]; subagentToolNames: string[] }
  | { type: 'characterSpritesLoaded'; characters: CharacterSpriteSet[] }
  | { type: 'floorTilesLoaded'; sprites: string[][][] }
  | { type: 'wallTilesLoaded'; sets: string[][][][] }
  | { type: 'carpetTilesLoaded'; sets: string[][][][] }
  | {
      type: 'furnitureAssetsLoaded';
      catalog: FurnitureAsset[];
      sprites: Record<string, string[][]>;
    }
  | {
      type: 'settingsLoaded';
      soundEnabled: boolean;
      lastSeenVersion: string;
      extensionVersion: string;
      watchAllSessions: boolean;
      alwaysShowLabels: boolean;
      ghostHeadlessAgents: boolean;
      hooksEnabled: boolean;
      hooksInfoShown: boolean;
      externalAssetDirectories: string[];
      showAreas: boolean;
    }
  | { type: 'areaMappingsLoaded'; mappings: Record<string, string[]> }
  | ExistingAgentsMessage
  | { type: 'layoutLoaded'; layout: Record<string, unknown> | null }
  | { type: 'agentStatus'; id: number; status: 'active' | 'waiting' }
  | { type: 'agentToolStart'; id: number; toolId: string; status: string; toolName: string }
  | { type: 'agentToolDone'; id: number; toolId: string }
  | { type: 'agentToolsClear'; id: number };
