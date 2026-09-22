import { AWAY_AFTER_MS, isAway, minutesAway, useDiscoveryStore } from '../src/state/discoveryStore';

const profile = { id: 'p1', nickname: 'Ana', location: { kind: 'plane' as const, seat: { row: 3, letter: 'C' as const } } };

describe('someone who leaves the app', () => {
  afterEach(() => jest.restoreAllMocks());

  it('is shown as away after missing a few beats, not dropped', () => {
    const start = 1_000_000;
    jest.spyOn(Date, 'now').mockReturnValue(start);
    useDiscoveryStore.setState({ peers: {} });
    useDiscoveryStore.getState().setProfile(profile);
    const peer = useDiscoveryStore.getState().peers.p1;

    expect(isAway(peer, start + 20_000)).toBe(false);
    expect(isAway(peer, start + AWAY_AFTER_MS + 1)).toBe(true);
    expect(minutesAway(peer, start + 3 * 60_000 + 5_000)).toBe(3);

    jest.spyOn(Date, 'now').mockReturnValue(start + 5 * 60_000);
    useDiscoveryStore.getState().pruneStale();
    expect(useDiscoveryStore.getState().peers.p1).toBeDefined();
  });

  it('is forgotten after ten minutes, and back the moment their beat returns', () => {
    const start = 1_000_000;
    jest.spyOn(Date, 'now').mockReturnValue(start);
    useDiscoveryStore.setState({ peers: {} });
    useDiscoveryStore.getState().setProfile(profile);

    jest.spyOn(Date, 'now').mockReturnValue(start + 10 * 60_000 + 1);
    useDiscoveryStore.getState().pruneStale();
    expect(useDiscoveryStore.getState().peers.p1).toBeUndefined();

    useDiscoveryStore.getState().setProfile(profile);
    expect(isAway(useDiscoveryStore.getState().peers.p1, start + 10 * 60_000 + 2)).toBe(false);
  });
});
