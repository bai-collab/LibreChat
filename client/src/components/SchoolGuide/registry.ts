import type { SchoolGuide } from './types';

/**
 * Single source for school operation guides: the in-app guide overlay reads it
 * directly, and `school-ai-office/build-guide.mjs` renders it into
 * `school-ai-office/guide.html`. Run `node school-ai-office/build-guide.mjs`
 * after editing; `--check` fails when guide.html is stale.
 */
export const schoolGuides: SchoolGuide[] = [
  {
    id: 'start-chat',
    audience: 'teacher',
    titleKey: 'com_ui_school_guide_start_chat_title',
    summaryKey: 'com_ui_school_guide_start_chat_summary',
    keywords: ['開始', '新對話', '聊天', '問問題', '使用助手', '選助手', '怎麼用', '提問', '助手'],
    steps: [
      {
        textKey: 'com_ui_school_guide_start_chat_1',
        target: [
          {
            testId: 'new-chat-button',
          },
          {
            testId: 'header-new-chat-button',
          },
        ],
        mock: {
          screen: 'app',
          panel: 'history',
          target: 'new-chat',
          where: 'LibreChat › 對話畫面',
        },
      },
      {
        textKey: 'com_ui_school_guide_start_chat_2',
        target: [
          {
            labelKey: 'com_ui_select_model',
          },
        ],
        mock: {
          screen: 'app',
          panel: 'history',
          target: 'model-select',
          where: 'LibreChat › 對話畫面',
        },
      },
      {
        textKey: 'com_ui_school_guide_start_chat_3',
        tipKey: 'com_ui_school_guide_start_chat_3_tip',
        target: null,
        mock: {
          screen: 'app',
          panel: 'history',
          popover: 'model',
          target: 'model-option',
          where: 'LibreChat › 選擇模型',
        },
      },
      {
        textKey: 'com_ui_school_guide_start_chat_4',
        target: [
          {
            testId: 'text-input',
          },
        ],
        mock: {
          screen: 'app',
          panel: 'history',
          target: 'composer-input',
          where: 'LibreChat › 輸入框',
        },
      },
      {
        textKey: 'com_ui_school_guide_start_chat_5',
        target: [
          {
            testId: 'send-button',
          },
        ],
        mock: {
          screen: 'app',
          panel: 'history',
          target: 'send',
          where: 'LibreChat › 輸入框',
        },
      },
    ],
  },
  {
    id: 'upload-file',
    audience: 'teacher',
    titleKey: 'com_ui_school_guide_upload_file_title',
    summaryKey: 'com_ui_school_guide_upload_file_summary',
    keywords: ['上傳', '檔案', '附件', 'pdf', 'word', '讀檔', '文件', '摘要', '迴紋針'],
    steps: [
      {
        textKey: 'com_ui_school_guide_upload_file_1',
        target: [
          {
            id: 'attach-file-menu-button',
          },
        ],
        mock: {
          screen: 'app',
          panel: 'history',
          target: 'attach',
          where: 'LibreChat › 輸入框',
        },
      },
      {
        textKey: 'com_ui_school_guide_upload_file_2',
        tipKey: 'com_ui_school_guide_upload_file_2_tip',
        target: [
          {
            role: 'menuitem',
            textKey: 'com_ui_upload_ocr_text',
          },
        ],
        mock: {
          screen: 'app',
          panel: 'history',
          popover: 'attach',
          target: 'upload-text',
          where: 'LibreChat › 附加檔案',
        },
      },
      {
        textKey: 'com_ui_school_guide_upload_file_3',
        target: [
          {
            testId: 'text-input',
          },
        ],
        mock: {
          screen: 'app',
          panel: 'history',
          target: 'composer-input',
          where: 'LibreChat › 輸入框',
        },
      },
      {
        textKey: 'com_ui_school_guide_upload_file_4',
        target: [
          {
            testId: 'send-button',
          },
        ],
        mock: {
          screen: 'app',
          panel: 'history',
          target: 'send',
          where: 'LibreChat › 輸入框',
        },
      },
    ],
  },
  {
    id: 'create-agent',
    audience: 'teacher',
    titleKey: 'com_ui_school_guide_create_agent_title',
    summaryKey: 'com_ui_school_guide_create_agent_summary',
    keywords: [
      '建立',
      '新增',
      '做一個',
      '自己的助手',
      '建一個',
      '新的 agent',
      '新助手',
      '指示',
      '設定助手',
    ],
    steps: [
      {
        textKey: 'com_ui_school_guide_create_agent_1',
        target: [
          {
            testId: 'nav-panel-agents',
          },
        ],
        mock: {
          screen: 'app',
          panel: 'builder',
          target: 'rail-builder',
          where: 'LibreChat › 側邊欄',
        },
      },
      {
        textKey: 'com_ui_school_guide_create_agent_2',
        target: [
          {
            labelKey: 'com_ui_agent',
          },
        ],
        mock: {
          screen: 'app',
          panel: 'builder',
          popover: 'agent',
          target: 'agent-new',
          where: 'LibreChat › 代理建構器',
        },
      },
      {
        textKey: 'com_ui_school_guide_create_agent_3',
        target: [
          {
            id: 'name',
          },
        ],
        mock: {
          screen: 'app',
          panel: 'builder',
          target: 'agent-name',
          where: 'LibreChat › 代理建構器',
        },
      },
      {
        textKey: 'com_ui_school_guide_create_agent_4',
        tipKey: 'com_ui_school_guide_create_agent_4_tip',
        target: [
          {
            id: 'instructions',
          },
        ],
        mock: {
          screen: 'app',
          panel: 'builder',
          target: 'agent-instructions',
          where: 'LibreChat › 代理建構器',
        },
      },
      {
        textKey: 'com_ui_school_guide_create_agent_5',
        target: [
          {
            id: 'provider',
          },
        ],
        mock: {
          screen: 'app',
          panel: 'builder',
          target: 'agent-model',
          where: 'LibreChat › 代理建構器',
        },
      },
      {
        textKey: 'com_ui_school_guide_create_agent_6',
        tipKey: 'com_ui_school_guide_create_agent_6_tip',
        target: [
          {
            labelKey: 'com_ui_create',
          },
          {
            labelKey: 'com_ui_save',
          },
        ],
        mock: {
          screen: 'app',
          panel: 'builder',
          target: 'btn-save',
          where: 'LibreChat › 代理建構器',
        },
      },
    ],
  },
  {
    id: 'find-chat',
    audience: 'teacher',
    titleKey: 'com_ui_school_guide_find_chat_title',
    summaryKey: 'com_ui_school_guide_find_chat_summary',
    keywords: [
      '找',
      '以前',
      '之前',
      '歷史',
      '紀錄',
      '搜尋',
      '舊的對話',
      '上次',
      '去哪找',
      '上週',
      '昨天',
    ],
    steps: [
      {
        textKey: 'com_ui_school_guide_find_chat_1',
        target: [
          {
            testId: 'nav-panel-conversations',
          },
        ],
        mock: {
          screen: 'app',
          panel: 'history',
          target: 'rail-history',
          where: 'LibreChat › 側邊欄',
        },
      },
      {
        textKey: 'com_ui_school_guide_find_chat_2',
        target: [
          {
            labelKey: 'com_nav_search_placeholder',
          },
        ],
        mock: {
          screen: 'app',
          panel: 'history',
          target: 'history-search',
          where: 'LibreChat › 對話紀錄',
        },
      },
      {
        textKey: 'com_ui_school_guide_find_chat_3',
        target: null,
        mock: {
          screen: 'app',
          panel: 'history',
          target: 'history-item',
          where: 'LibreChat › 對話紀錄',
        },
      },
    ],
  },
  {
    id: 'share-agent',
    audience: 'admin',
    titleKey: 'com_ui_school_guide_share_agent_title',
    summaryKey: 'com_ui_school_guide_share_agent_summary',
    keywords: [
      '分享',
      '分給',
      '派給',
      '指定',
      '主任',
      '處室',
      '總務',
      '教務',
      '學務',
      '輔導',
      '專屬',
      '給別人',
      '共用',
    ],
    steps: [
      {
        textKey: 'com_ui_school_guide_share_agent_1',
        tipKey: 'com_ui_school_guide_share_agent_1_tip',
        target: [
          {
            testId: 'nav-panel-agents',
          },
        ],
        mock: {
          screen: 'app',
          panel: 'builder',
          target: 'rail-builder',
          where: 'LibreChat › 側邊欄',
        },
      },
      {
        textKey: 'com_ui_school_guide_share_agent_2',
        target: [
          {
            labelKey: 'com_ui_agent',
          },
        ],
        mock: {
          screen: 'app',
          panel: 'builder',
          target: 'agent-select',
          where: 'LibreChat › 代理建構器',
        },
      },
      {
        textKey: 'com_ui_school_guide_share_agent_3',
        target: [
          {
            labelPrefixKey: 'com_ui_share_var',
          },
        ],
        mock: {
          screen: 'app',
          panel: 'builder',
          target: 'btn-share',
          where: 'LibreChat › 代理建構器',
        },
      },
      {
        textKey: 'com_ui_school_guide_share_agent_4',
        target: [
          {
            within: 'dialog',
            placeholderKey: 'com_ui_search_people_placeholder',
          },
        ],
        mock: {
          screen: 'share',
          target: 'people-search',
          where: 'LibreChat › 分享對話框',
        },
      },
      {
        textKey: 'com_ui_school_guide_share_agent_5',
        tipKey: 'com_ui_school_guide_share_agent_5_tip',
        target: [
          {
            within: 'dialog',
            labelKey: 'com_ui_role_viewer_desc',
          },
        ],
        mock: {
          screen: 'share',
          target: 'role-select',
          where: 'LibreChat › 分享對話框',
        },
      },
      {
        textKey: 'com_ui_school_guide_share_agent_6',
        target: [
          {
            within: 'dialog',
            labelKey: 'com_ui_save',
          },
        ],
        mock: {
          screen: 'share',
          target: 'share-save',
          where: 'LibreChat › 分享對話框',
        },
      },
    ],
  },
  {
    id: 'allow-sharing',
    audience: 'admin',
    titleKey: 'com_ui_school_guide_allow_sharing_title',
    summaryKey: 'com_ui_school_guide_allow_sharing_summary',
    keywords: [
      '一般',
      '老師',
      '使用者',
      '權限',
      '允許',
      '開放',
      '管理員設定',
      '自己做',
      '可以分享',
      '公開',
    ],
    steps: [
      {
        textKey: 'com_ui_school_guide_allow_sharing_1',
        tipKey: 'com_ui_school_guide_allow_sharing_1_tip',
        target: [
          {
            testId: 'nav-panel-agents',
          },
        ],
        mock: {
          screen: 'app',
          panel: 'builder',
          target: 'rail-builder',
          where: 'LibreChat › 側邊欄',
        },
      },
      {
        textKey: 'com_ui_school_guide_allow_sharing_2',
        target: [
          {
            labelKey: 'com_ui_admin_settings',
          },
        ],
        mock: {
          screen: 'app',
          panel: 'builder',
          target: 'btn-admin',
          where: 'LibreChat › 代理建構器',
        },
      },
      {
        textKey: 'com_ui_school_guide_allow_sharing_3',
        target: [
          {
            within: 'dialog',
            labelledByKey: 'com_ui_role_select',
          },
        ],
        mock: {
          screen: 'admin',
          target: 'admin-role',
          where: 'LibreChat › 管理員設定',
        },
      },
      {
        textKey: 'com_ui_school_guide_allow_sharing_4',
        target: [
          {
            within: 'dialog',
            labelKey: 'com_ui_agents_allow_share',
          },
        ],
        mock: {
          screen: 'admin',
          target: 'toggle-share',
          where: 'LibreChat › 管理員設定',
        },
      },
      {
        textKey: 'com_ui_school_guide_allow_sharing_5',
        target: [
          {
            within: 'dialog',
            labelKey: 'com_ui_agents_allow_share_public',
          },
        ],
        mock: {
          screen: 'admin',
          target: 'toggle-public',
          where: 'LibreChat › 管理員設定',
        },
      },
      {
        textKey: 'com_ui_school_guide_allow_sharing_6',
        tipKey: 'com_ui_school_guide_allow_sharing_6_tip',
        target: [
          {
            within: 'dialog',
            labelKey: 'com_ui_save',
          },
        ],
        mock: {
          screen: 'admin',
          target: 'admin-save',
          where: 'LibreChat › 管理員設定',
        },
      },
    ],
  },
  {
    id: 'google-login',
    audience: 'admin',
    titleKey: 'com_ui_school_guide_google_login_title',
    summaryKey: 'com_ui_school_guide_google_login_summary',
    keywords: ['google', '谷歌', '登入', '網域', 'oauth', 'gmail', '註冊', 'workspace'],
    steps: [
      {
        textKey: 'com_ui_school_guide_google_login_1',
        tipKey: 'com_ui_school_guide_google_login_1_tip',
        external: 'gcp',
        target: null,
        mock: {
          screen: 'gcp',
          target: 'audience-internal',
          where: 'console.cloud.google.com › Google Auth Platform',
        },
      },
      {
        textKey: 'com_ui_school_guide_google_login_2',
        external: 'gcp',
        target: null,
        mock: {
          screen: 'gcp',
          target: 'app-type',
          where: 'Google Auth Platform › 用戶端',
        },
      },
      {
        textKey: 'com_ui_school_guide_google_login_3',
        external: 'gcp',
        target: null,
        mock: {
          screen: 'gcp',
          target: 'js-origin',
          where: 'Google Auth Platform › 用戶端',
        },
      },
      {
        textKey: 'com_ui_school_guide_google_login_4',
        tipKey: 'com_ui_school_guide_google_login_4_tip',
        external: 'gcp',
        target: null,
        mock: {
          screen: 'gcp',
          target: 'redirect-uri',
          where: 'Google Auth Platform › 用戶端',
        },
      },
      {
        textKey: 'com_ui_school_guide_google_login_5',
        external: 'gcp',
        target: null,
        mock: {
          screen: 'gcp',
          target: 'gcp-create',
          where: 'Google Auth Platform › 用戶端',
        },
      },
      {
        textKey: 'com_ui_school_guide_google_login_6',
        external: 'env',
        target: null,
        mock: {
          screen: 'env',
          target: 'env-social',
          where: '記事本 › .env',
        },
      },
      {
        textKey: 'com_ui_school_guide_google_login_7',
        external: 'env',
        target: null,
        mock: {
          screen: 'env',
          target: 'env-google',
          where: '記事本 › .env',
        },
      },
      {
        textKey: 'com_ui_school_guide_google_login_8',
        tipKey: 'com_ui_school_guide_google_login_8_tip',
        external: 'yaml',
        target: null,
        mock: {
          screen: 'yaml',
          target: 'yaml-domains',
          where: '記事本 › librechat.yaml（根目錄那份）',
        },
      },
      {
        textKey: 'com_ui_school_guide_google_login_9',
        target: [
          {
            testId: 'google',
          },
        ],
        mock: {
          screen: 'login',
          target: 'google-btn',
          where: 'http://localhost:3080/login',
        },
      },
    ],
  },
];
