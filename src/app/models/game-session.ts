export enum ActivePhase {
  ChampSelect = 'ChampSelect',
  InGame = 'InGame',
  PostGame = 'PostGame'
}

export enum EnemyPlaystyle {
  Aggressive = 'Aggressive',
  Passive = 'Passive',
  UnderTower = 'UnderTower',
  Neutral = 'Neutral'
}

export interface GameSessionState {
  userChampion: string;
  opponentChampion: string;
  selectedRunes: string[];
  activePhase: ActivePhase;
  enemyPlaystyle: EnemyPlaystyle;
  adviceRequested: boolean;
  adviceText: string;
}
