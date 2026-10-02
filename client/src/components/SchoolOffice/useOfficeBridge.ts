import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { Constants, ContentTypes, EModelEndpoint, PermissionBits } from 'librechat-data-provider';
import type { Agent, TMessage, TMessageContentParts } from 'librechat-data-provider';
import type {
  CharacterSpriteSet,
  ExistingAgentsMessage,
  FurnitureAsset,
  PixelOfficeServerMessage,
} from './protocol';
import { useListAgentsQuery } from '~/data-provider/Agents';
import { useGetMessagesByConvoId } from '~/data-provider';
import useLocalize from '~/hooks/useLocalize';
import store from '~/store';

type OfficeAgent = { officeId: number; agentId: string; name: string; palette: number };
type ActivityKind = 'thinking' | 'writing' | 'tool';
type ActiveActivity = { officeId: number; toolId: string; signature: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getRosterMessage(agents: OfficeAgent[]): ExistingAgentsMessage {
  return {
    type: 'existingAgents',
    agents: agents.map((agent) => agent.officeId),
    agentMeta: Object.fromEntries(
      agents.map((agent) => [agent.officeId, { palette: agent.palette, hueShift: 0 }]),
    ),
    folderNames: Object.fromEntries(agents.map((agent) => [agent.officeId, agent.name])),
    externalAgents: {},
  };
}

function getRosterSignature(agents: OfficeAgent[]): string {
  return JSON.stringify(agents.map(({ agentId, name, palette }) => [agentId, name, palette]));
}

function getLatestAssistantMessage(
  messages: TMessage[] | undefined,
  submittedUserMessageId?: string,
  submittedResponseMessageId?: string,
): TMessage | undefined {
  if (!messages?.length) {
    return undefined;
  }

  let latestUserMessageId: string | undefined;
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index]?.isCreatedByUser) {
      latestUserMessageId = messages[index]?.messageId;
      break;
    }
  }

  if (!latestUserMessageId) {
    return undefined;
  }

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message && !message.isCreatedByUser) {
      if (message.messageId === submittedResponseMessageId) {
        return message;
      }
      if (message.parentMessageId === (submittedUserMessageId ?? latestUserMessageId)) {
        return message;
      }
    }
  }

  return undefined;
}

function hasText(part: TMessageContentParts) {
  if (part.type !== ContentTypes.TEXT || part.text == null) {
    return false;
  }
  return typeof part.text === 'string' ? part.text.trim().length > 0 : true;
}

async function fetchOfficeAsset<T>(fileName: string, signal: AbortSignal): Promise<T> {
  const assetUrl = new URL(
    `${import.meta.env.BASE_URL}pixel-office/data/${fileName}`,
    window.location.origin,
  );
  const response = await fetch(assetUrl, { signal });
  if (!response.ok) {
    throw new Error(`Could not load pixel office asset: ${fileName}`);
  }
  return (await response.json()) as T;
}

export default function useOfficeBridge(isOpen: boolean, localize: ReturnType<typeof useLocalize>) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [bridgeReady, setBridgeReady] = useState(false);
  const rosterSignatureRef = useRef('');
  const handshakeStartedRef = useRef(false);
  const activeActivityRef = useRef<ActiveActivity | null>(null);
  const toolSequenceRef = useRef(0);
  const rosterRef = useRef<OfficeAgent[]>([]);

  const conversationId = useRecoilValue(store.conversationIdByIndex(0));
  const conversationAgentId = useRecoilValue(store.conversationAgentIdByIndex(0));
  const conversationEndpoint = useRecoilValue(store.effectiveEndpointByIndex(0));
  const isSubmitting = useRecoilValue(store.isSubmittingFamily(0));
  const submission = useRecoilValue(store.submissionByIndex(0));

  const agentQuery = useListAgentsQuery(
    { requiredPermission: PermissionBits.VIEW },
    { enabled: isOpen },
  );
  const { data: messages } = useGetMessagesByConvoId(
    conversationId ?? '',
    {
      enabled: isOpen && !!conversationId && conversationId !== Constants.SEARCH,
      refetchOnMount: false,
    },
    { isStreaming: isSubmitting },
  );

  const agents = useMemo(() => agentQuery.data?.data ?? [], [agentQuery.data?.data]);
  const roster = useMemo(
    () =>
      agents.map((agent: Agent, index) => ({
        officeId: index + 1,
        agentId: agent.id,
        name: agent.name?.trim() || agent.id,
        palette: index % 6,
      })),
    [agents],
  );
  const rosterSignature = getRosterSignature(roster);
  const rosterOfficeId = roster.find((agent) => agent.agentId === conversationAgentId)?.officeId;
  rosterRef.current = roster;

  const postToOffice = useCallback((message: PixelOfficeServerMessage) => {
    const officeWindow = iframeRef.current?.contentWindow;
    if (officeWindow) {
      officeWindow.postMessage(message, window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setBridgeReady(false);
      handshakeStartedRef.current = false;
      rosterSignatureRef.current = '';
      activeActivityRef.current = null;
      return;
    }

    const controller = new AbortController();

    const onMessage = (event: MessageEvent<unknown>) => {
      if (
        event.origin !== window.location.origin ||
        event.source !== iframeRef.current?.contentWindow ||
        !isRecord(event.data) ||
        event.data.source !== 'pixel-office' ||
        !isRecord(event.data.msg) ||
        event.data.msg.type !== 'webviewReady' ||
        handshakeStartedRef.current
      ) {
        return;
      }

      handshakeStartedRef.current = true;
      void (async () => {
        try {
          const [characters, floors, walls, carpets, furniture, catalog, layout] =
            await Promise.all([
              fetchOfficeAsset<CharacterSpriteSet[]>('decoded_characters.json', controller.signal),
              fetchOfficeAsset<string[][][]>('decoded_floors.json', controller.signal),
              fetchOfficeAsset<string[][][][]>('decoded_walls.json', controller.signal),
              fetchOfficeAsset<string[][][][]>('decoded_carpets.json', controller.signal),
              fetchOfficeAsset<Record<string, string[][]>>(
                'decoded_furniture.json',
                controller.signal,
              ),
              fetchOfficeAsset<FurnitureAsset[]>('furniture-catalog.json', controller.signal),
              fetchOfficeAsset<Record<string, unknown>>('layout.json', controller.signal),
            ]);

          if (controller.signal.aborted) {
            return;
          }

          const send = (message: PixelOfficeServerMessage) => {
            const frameWindow = iframeRef.current?.contentWindow;
            if (frameWindow) {
              frameWindow.postMessage(message, window.location.origin);
            }
          };

          send({
            type: 'providerCapabilities',
            readingTools: [localize('com_ui_school_office_tool_reading')],
            subagentToolNames: [],
          });
          send({ type: 'characterSpritesLoaded', characters });
          send({ type: 'floorTilesLoaded', sprites: floors });
          send({ type: 'wallTilesLoaded', sets: walls });
          send({ type: 'carpetTilesLoaded', sets: carpets });
          send({ type: 'furnitureAssetsLoaded', catalog, sprites: furniture });
          send({
            type: 'settingsLoaded',
            soundEnabled: false,
            lastSeenVersion: 'school',
            extensionVersion: 'school',
            watchAllSessions: false,
            alwaysShowLabels: true,
            ghostHeadlessAgents: false,
            hooksEnabled: false,
            hooksInfoShown: true,
            externalAssetDirectories: [],
            showAreas: false,
          });
          send({ type: 'areaMappingsLoaded', mappings: {} });
          send(getRosterMessage(rosterRef.current));
          rosterSignatureRef.current = getRosterSignature(rosterRef.current);
          send({ type: 'layoutLoaded', layout });
          setBridgeReady(true);
        } catch {
          // Keep the bridge inactive if any local asset cannot be loaded.
        }
      })();
    };

    window.addEventListener('message', onMessage);
    return () => {
      controller.abort();
      window.removeEventListener('message', onMessage);
      handshakeStartedRef.current = false;
      activeActivityRef.current = null;
    };
  }, [isOpen, localize]);

  useEffect(() => {
    if (!bridgeReady || rosterSignature === rosterSignatureRef.current) {
      return;
    }
    postToOffice(getRosterMessage(roster));
    rosterSignatureRef.current = rosterSignature;
  }, [bridgeReady, postToOffice, roster, rosterSignature]);

  const beginActivity = useCallback(
    (officeId: number, signature: string, kind: ActivityKind, toolStatus?: string) => {
      const current = activeActivityRef.current;
      if (current?.officeId === officeId && current.signature === signature) {
        return;
      }
      if (current) {
        postToOffice({ type: 'agentToolDone', id: current.officeId, toolId: current.toolId });
        if (current.officeId !== officeId) {
          postToOffice({ type: 'agentToolsClear', id: current.officeId });
          postToOffice({ type: 'agentStatus', id: current.officeId, status: 'waiting' });
        }
      }

      const toolId = `school-${Date.now()}-${toolSequenceRef.current++}`;
      let toolName: string;
      let status: string;
      if (kind === 'thinking') {
        toolName = localize('com_ui_school_office_tool_thinking');
        status = localize('com_ui_school_office_status_thinking');
      } else if (kind === 'writing') {
        toolName = localize('com_ui_school_office_tool_writing');
        status = localize('com_ui_school_office_status_writing');
      } else {
        toolName = localize('com_ui_school_office_tool_reading');
        status = toolStatus ?? '';
      }

      activeActivityRef.current = { officeId, toolId, signature };
      postToOffice({ type: 'agentStatus', id: officeId, status: 'active' });
      postToOffice({ type: 'agentToolStart', id: officeId, toolId, status, toolName });
    },
    [localize, postToOffice],
  );

  const finishActivity = useCallback(() => {
    const current = activeActivityRef.current;
    if (!current) {
      return;
    }
    postToOffice({ type: 'agentToolDone', id: current.officeId, toolId: current.toolId });
    postToOffice({ type: 'agentToolsClear', id: current.officeId });
    postToOffice({ type: 'agentStatus', id: current.officeId, status: 'waiting' });
    activeActivityRef.current = null;
  }, [postToOffice]);

  useEffect(() => {
    if (!bridgeReady) {
      return;
    }
    if (!isSubmitting || conversationEndpoint !== EModelEndpoint.agents || rosterOfficeId == null) {
      finishActivity();
      return;
    }
    beginActivity(rosterOfficeId, `thinking:${conversationId ?? ''}`, 'thinking');
  }, [
    beginActivity,
    bridgeReady,
    conversationEndpoint,
    conversationId,
    finishActivity,
    isSubmitting,
    rosterOfficeId,
  ]);

  useEffect(() => {
    if (
      !bridgeReady ||
      !isSubmitting ||
      conversationEndpoint !== EModelEndpoint.agents ||
      rosterOfficeId == null
    ) {
      return;
    }

    const latestAssistant = getLatestAssistantMessage(
      messages,
      submission?.userMessage?.messageId,
      submission?.initialResponse?.messageId,
    );
    const content = latestAssistant?.content;
    if (!content?.length || !latestAssistant) {
      return;
    }

    for (let index = content.length - 1; index >= 0; index -= 1) {
      const part = content[index];
      if (!part) {
        continue;
      }
      if (part.type === ContentTypes.TOOL_CALL) {
        const toolCallValue: unknown = part.tool_call;
        const toolCall = isRecord(toolCallValue) ? toolCallValue : {};
        const toolFunction = isRecord(toolCall.function) ? toolCall.function : undefined;
        let toolName = 'tool';
        if (typeof toolFunction?.name === 'string') {
          toolName = toolFunction.name;
        } else if (typeof toolCall.name === 'string') {
          toolName = toolCall.name;
        } else if (typeof toolCall.type === 'string') {
          toolName = toolCall.type;
        }
        const callId = typeof toolCall.id === 'string' ? toolCall.id : `${index}`;
        beginActivity(
          rosterOfficeId,
          `tool:${latestAssistant.messageId}:${callId}`,
          'tool',
          localize('com_ui_school_office_status_tool', { name: toolName }),
        );
        return;
      }
      if (hasText(part)) {
        beginActivity(rosterOfficeId, `writing:${latestAssistant.messageId}`, 'writing');
        return;
      }
    }
  }, [
    beginActivity,
    bridgeReady,
    conversationEndpoint,
    isSubmitting,
    localize,
    messages,
    rosterOfficeId,
    submission?.initialResponse?.messageId,
    submission?.userMessage?.messageId,
  ]);

  return {
    iframeRef,
    iframeSrc: `${import.meta.env.BASE_URL}pixel-office/index.html`,
  };
}
