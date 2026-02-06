export interface PopOutMessage<T = any> {
  type: PopOutMessageType;
  payload?: T;
  timestamp?: number;
}

export enum PopOutMessageType {
  STATE_UPDATE = 'STATE_UPDATE',
  CLOSE_POPOUT = 'CLOSE_POPOUT',
  PANEL_READY = 'PANEL_READY',
  PICKER_SELECTION_CHANGE = 'PICKER_SELECTION_CHANGE',
  FILTER_ADD = 'FILTER_ADD',
  FILTER_REMOVE = 'FILTER_REMOVE',
  HIGHLIGHT_REMOVE = 'HIGHLIGHT_REMOVE',
  CLEAR_HIGHLIGHTS = 'CLEAR_HIGHLIGHTS',
  CLEAR_ALL_FILTERS = 'CLEAR_ALL_FILTERS',
  URL_PARAMS_CHANGED = 'URL_PARAMS_CHANGED',
  URL_PARAMS_SYNC = 'URL_PARAMS_SYNC',
  CHART_CLICK = 'CHART_CLICK',
}

export interface PickerSelectionPayload {
  configId: string;
  urlParam: string;
  urlValue: string;
}

export interface PopOutWindowRef {
  window: Window;
  channel: BroadcastChannel;
  checkInterval: number;
  panelId: string;
  panelType: string;
}

export interface PopOutWindowFeatures {
  width?: number;
  height?: number;
  left?: number;
  top?: number;
  menubar?: boolean;
  toolbar?: boolean;
  location?: boolean;
  status?: boolean;
  resizable?: boolean;
  scrollbars?: boolean;
}

export interface PopOutRouteParams {
  gridId: string;
  panelId: string;
  type: string;
}

export interface PopOutContext {
  isPopOut: boolean;
  panelId?: string;
  gridId?: string;
  panelType?: string;
}

export function buildWindowFeatures(features: PopOutWindowFeatures): string {
  const {
    width = 1200,
    height = 800,
    left = 100,
    top = 100,
    menubar = false,
    toolbar = false,
    location = false,
    status = false,
    resizable = true,
    scrollbars = true,
  } = features;

  const boolToYesNo = (val: boolean) => (val ? 'yes' : 'no');

  return [
    `width=${width}`,
    `height=${height}`,
    `left=${left}`,
    `top=${top}`,
    `menubar=${boolToYesNo(menubar)}`,
    `toolbar=${boolToYesNo(toolbar)}`,
    `location=${boolToYesNo(location)}`,
    `status=${boolToYesNo(status)}`,
    `resizable=${boolToYesNo(resizable)}`,
    `scrollbars=${boolToYesNo(scrollbars)}`,
  ].join(',');
}

export function parsePopOutRoute(url: string): PopOutContext | null {
  // Match /popout/:gridId/:componentId/:type (e.g., /popout/automobile-discover/chart-year/chart)
  const match = url.match(/^\/popout\/([^/]+)\/([^/]+)\/([^/]+)/);

  if (!match) {
    return null;
  }

  return {
    isPopOut: true,
    gridId: match[1],
    panelId: match[2],
    panelType: match[3],
  };
}
