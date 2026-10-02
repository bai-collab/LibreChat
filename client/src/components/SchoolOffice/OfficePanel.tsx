import { useState } from 'react';
import { IconButton } from '@librechat/client';
import { PanelRightClose, PanelRightOpen } from 'lucide-react';
import useOfficeBridge from './useOfficeBridge';
import { useLocalize } from '~/hooks';

const OFFICE_PANEL_STORAGE_KEY = 'school-office-panel-open';

function getInitialOpenState(): boolean {
  try {
    const savedState = window.localStorage.getItem(OFFICE_PANEL_STORAGE_KEY);
    if (savedState != null) {
      return savedState === 'true';
    }
  } catch {
    // Use the screen-size default if local storage is unavailable.
  }
  return window.matchMedia?.('(min-width: 1280px)').matches ?? false;
}

export default function OfficePanel() {
  const localize = useLocalize();
  const [isOpen, setIsOpen] = useState(getInitialOpenState);
  const { iframeRef, iframeSrc } = useOfficeBridge(isOpen, localize);

  const setOpenAndPersist = (nextOpen: boolean) => {
    setIsOpen(nextOpen);
    try {
      window.localStorage.setItem(OFFICE_PANEL_STORAGE_KEY, String(nextOpen));
    } catch {
      // The panel remains usable without persisting its open state.
    }
  };

  return (
    <aside
      aria-label={localize('com_ui_school_office')}
      className={`flex shrink-0 flex-col text-text-primary transition-[width] duration-200 motion-reduce:transition-none ${
        isOpen
          ? 'absolute inset-y-0 right-0 z-30 w-[85vw] min-w-0 max-w-[85vw] border-l border-border-light bg-surface-primary sm:static sm:h-full sm:w-[24rem] sm:min-w-[18rem] sm:max-w-[38vw]'
          : 'fixed right-3 top-16 z-50 h-auto w-auto border-0 bg-transparent md:static md:h-full md:w-12 md:border-l md:border-border-light md:bg-surface-primary'
      }`}
    >
      {isOpen ? (
        <>
          <header className="flex h-12 shrink-0 items-center justify-between border-b border-border-light px-3">
            <h2 className="truncate text-sm font-semibold">{localize('com_ui_school_office')}</h2>
            <IconButton
              label={localize('com_ui_school_office_collapse')}
              variant="ghost"
              size="sm"
              shape="square"
              aria-expanded={isOpen}
              onClick={() => setOpenAndPersist(false)}
            >
              <PanelRightClose aria-hidden="true" className="size-4" />
            </IconButton>
          </header>
          <iframe
            ref={iframeRef}
            className="min-h-0 w-full flex-1 border-0 bg-surface-primary"
            src={iframeSrc}
            title={localize('com_ui_school_office_frame_title')}
          />
        </>
      ) : (
        <IconButton
          label={localize('com_ui_school_office_expand')}
          variant="ghost"
          size="sm"
          shape="square"
          aria-expanded={isOpen}
          className="h-12 w-12 md:w-full"
          onClick={() => setOpenAndPersist(true)}
        >
          <PanelRightOpen aria-hidden="true" className="size-4" />
        </IconButton>
      )}
    </aside>
  );
}
