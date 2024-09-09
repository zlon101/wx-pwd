const Color = {
  info: '🚀',
  debug: '🔥',
  warn: '⚠️',
  error: '❌',
} as const;
type IType = keyof (typeof Color);

export const log = (label: string, data?: any, type: IType = 'debug' ) => {
  try {
    const msg = ['undefined', 'object'].includes(typeof data) ? JSON.stringify(data, null, 2) : data;
    if (data === undefined) {
      console.debug(`\n${Color[type]} ${label}`);
    } else {
      console.debug(`\n${Color[type]} ${label}:\n${msg}`);
    }
  } catch (_) {
    console.debug(`\n${Color[type]} ${label}:\n`, data);
  }
};
