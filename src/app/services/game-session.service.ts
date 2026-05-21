import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GameSessionState, ActivePhase, EnemyPlaystyle } from '../models/game-session';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GameSessionService {
  private http = inject(HttpClient);
  private ws!: WebSocket;
  private reconnectInterval = 3000;
  private wsUrl: string;

  // Shared lookup signals
  public userProfile = signal<any | null>(null);
  public allChampions = signal<string[]>([]);

  // Signals
  public state = signal<GameSessionState>({
    userChampion: 'Ezreal',
    opponentChampion: 'Lux',
    selectedRunes: ['Press the Attack', 'Presence of Mind', 'Legend: Alacrity', 'Cut Down'],
    activePhase: ActivePhase.ChampSelect,
    enemyPlaystyle: EnemyPlaystyle.Neutral,
    adviceRequested: false,
    adviceText: ''
  });

  public isConnected = signal<boolean>(false);
  public isReconnecting = signal<boolean>(false);

  constructor() {
    let wsUrlBase = environment.apiBaseUrl.replace('http://', 'ws://').replace('https://', 'wss://');
    this.wsUrl = `${wsUrlBase}/ws`;
    this.connect();
    this.fetchChampions();
  }

  public setUserProfile(profile: any): void {
    this.userProfile.set(profile);
  }

  public fetchChampions(): void {
    this.http.get<string[]>(`${environment.apiBaseUrl}/api/profile/champions`).subscribe({
      next: (champs) => {
        this.allChampions.set(champs);
      },
      error: (err) => {
        console.error('Failed to fetch champions list', err);
      }
    });
  }

  private connect(): void {
    try {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => {
        console.log('Connected to WebSocket server');
        this.isConnected.set(true);
        this.isReconnecting.set(false);
      };

      this.ws.onmessage = (event) => {
        try {
          const newState = JSON.parse(event.data) as GameSessionState;
          if (newState) {
            this.state.set(newState);
          }
        } catch (err) {
          console.error('Error parsing incoming socket state:', err);
        }
      };

      this.ws.onclose = () => {
        this.isConnected.set(false);
        this.handleReconnect();
      };

      this.ws.onerror = (err) => {
        console.error('WebSocket error occurred:', err);
        this.ws.close();
      };
    } catch (error) {
      console.error('Failed to initialize WebSocket connection:', error);
      this.handleReconnect();
    }
  }

  private handleReconnect(): void {
    if (this.isReconnecting()) return;
    this.isReconnecting.set(true);
    setTimeout(() => {
      console.log('Attempting to reconnect WebSocket...');
      this.connect();
    }, this.reconnectInterval);
  }

  public updateState(updatedFields: Partial<GameSessionState>): void {
    const currentState = this.state();
    const newState: GameSessionState = {
      ...currentState,
      ...updatedFields
    };

    // Update local state immediately for snappy UI response
    this.state.set(newState);

    if (this.isConnected() && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(newState));
    }
  }
}
