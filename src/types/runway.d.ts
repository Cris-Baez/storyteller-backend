// Tipos para RunwayML SDK (workaround para TS)
declare module '@runwayml/sdk' {
  export default class RunwayML {
    constructor(opts: { apiKey: string });
    imageToVideo: {
      create(opts: {
        model: 'gen4_turbo' | 'gen3a_turbo',
        promptImage: string,
        promptText: string,
        ratio: '1280:720' | '720:1280' | '1104:832' | '832:1104' | '960:960' | '1584:672' | '1280:768' | '768:1280',
        duration: 5 | 10
      }): { waitForTaskOutput(): Promise<{ output: { url: string } } | { output: string[] }> };
    };
  }
}
