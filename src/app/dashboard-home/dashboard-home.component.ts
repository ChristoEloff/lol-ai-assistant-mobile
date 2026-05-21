import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ProfileSearchBarComponent } from '../profile-search-bar/profile-search-bar.component';
import { GameSessionService } from '../services/game-session.service';
import { environment } from '../../environments/environment';

interface UserProfile {
  puuid: string;
  gameName: string;
  tagLine: string;
  profileIconId: number;
  summonerLevel: number;
  currentPatch: string;
  rankDetails: Array<{
    queueType: string;
    tier: string;
    rank: string;
    leaguePoints: number;
    wins: number;
    losses: number;
  }>;
  topChampions: Array<{
    championId: number;
    championName: string;
    championLevel: number;
    championPoints: number;
    lastPlayTime: number;
  }>;
  freeChampionNames: string[];
  recentMatches: Array<{
    matchId: string;
    gameMode: string;
    gameDurationSeconds: number;
    championName: string;
    kills: number;
    deaths: number;
    assists: number;
    win: boolean;
    participants: Array<{
      championName: string;
      riotIdGameName: string;
      riotIdTagline: string;
      teamId: number;
      kills: number;
      deaths: number;
      assists: number;
      win: boolean;
    }>;
  }>;
  activeGame: {
    gameMode: string;
    gameLengthSeconds: number;
    championName: string;
  } | null;
}

interface MetaChampion {
  championName: string;
  winRate: number;
  tier: string;
  role: string;
}

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, FormsModule, ProfileSearchBarComponent],
  templateUrl: './dashboard-home.component.html',
  styleUrls: ['./dashboard-home.component.css']
})
export class DashboardHomeComponent implements OnInit {
  private http = inject(HttpClient);
  private sessionService = inject(GameSessionService);
  private router = inject(Router);
  
  public riotId = signal<string>('Provita8#EUW');
  public selectedRegion = signal<string>('EUW1');
  
  public loadingProfile = signal<boolean>(true);
  public loadingMeta = signal<boolean>(true);

  public userProfile = signal<UserProfile | null>(null);
  public metaChampions = signal<MetaChampion[]>([]);

  public soloQEntry = computed(() => {
    const profile = this.userProfile();
    if (!profile || !profile.rankDetails) return null;
    return profile.rankDetails.find(e => e.queueType === 'RANKED_SOLO_5x5') || null;
  });

  public winRate = computed(() => {
    const entry = this.soloQEntry();
    if (!entry) return 0;
    const total = entry.wins + entry.losses;
    return total > 0 ? Math.round((entry.wins / total) * 100) : 0;
  });

  ngOnInit() {
    this.fetchData();
  }

  public onSearchSelected(event: { region: string; riotId: string }) {
    this.riotId.set(event.riotId);
    this.selectedRegion.set(event.region);
    this.fetchData();
  }

  public fetchData() {
    this.loadingProfile.set(true);
    this.loadingMeta.set(true);
    
    const profileUrl = `${environment.apiBaseUrl}/api/profile?riotId=${encodeURIComponent(this.riotId())}&region=${this.selectedRegion()}`;
    this.http.get<UserProfile>(profileUrl).subscribe({
      next: (profile) => {
        this.userProfile.set(profile);
        this.sessionService.setUserProfile(profile);
        this.loadingProfile.set(false);
      },
      error: (err) => {
        console.error('Error fetching user profile', err);
        this.loadingProfile.set(false);
      }
    });

    const metaUrl = `${environment.apiBaseUrl}/api/meta`;
    this.http.get<MetaChampion[]>(metaUrl).subscribe({
      next: (meta) => {
        this.metaChampions.set(meta);
        this.loadingMeta.set(false);
      },
      error: (err) => {
        console.error('Error fetching meta tier list', err);
        this.loadingMeta.set(false);
      }
    });
  }

  public formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  public navigateToMatch(matchId: string) {
    const puuid = this.userProfile()?.puuid ?? '';
    this.router.navigate(['/match', matchId], { queryParams: { puuid } });
  }

  public navigateToChampion(championName: string) {
    const puuid = this.userProfile()?.puuid ?? '';
    const region = this.selectedRegion();
    this.router.navigate(['/champion', encodeURIComponent(championName)], {
      queryParams: { puuid, region }
    });
  }
}
