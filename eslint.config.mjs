import nextVitals from 'eslint-config-next/core-web-vitals'

const config = [
  ...nextVitals,
  {
    rules: {
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
    },
  },
  {
    ignores: [
      '.next/**',
      '.open-next/**',
      '.vercel/**',
      '.wrangler/**',
      'cloudflare-env.d.ts',
      'node_modules/**',
      'tsconfig.tsbuildinfo',
    ],
  },
]

export default config
