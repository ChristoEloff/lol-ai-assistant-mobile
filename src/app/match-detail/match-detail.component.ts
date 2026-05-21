import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

interface MatchParticipant {
  summonerName: string;
  riotIdGameName: string;
  riotIdTagline: string;
  championName: string;
  kills: number;
  deaths: number;
  assists: number;
  win: boolean;
  totalDamageDealtToChampions: number;
  goldEarned: number;
  visionScore: number;
  minionsKilled: number;
  teamId: number;
}

interface DetailedMatch {
  matchId: string;
  gameMode: string;
  gameDurationSeconds: number;
  championName: string;
  kills: number;
  deaths: number;
  assists: number;
  win: boolean;
  totalDamageDealtToChampions: number;
  totalDamageTaken: number;
  goldEarned: number;
  totalMinionsKilled: number;
  neutralMinionsKilled: number;
  visionScore: number;
  lane: string;
  role: string;
  doubleKills: number;
  tripleKills: number;
  quadraKills: number;
  pentaKills: number;
  participants: MatchParticipant[];
}

@Component({
  selector: 'app-match-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './match-detail.component.html',
  styleUrls: ['./match-detail.component.css']
})
export class MatchDetailComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  matchId = signal<string>('');
  puuid = signal<string>('');

  match = signal<DetailedMatch | null>(null);
  loadingMatch = signal(true);
  matchError = signal('');

  reviewText = signal('');
  loadingReview = signal(false);
  reviewError = signal('');
  reviewRequested = signal(false);

  blueTeam = computed(() =>
    (this.match()?.participants ?? []).filter(p => p.teamId === 100)
  );
  redTeam = computed(() =>
    (this.match()?.participants ?? []).filter(p => p.teamId === 200)
  );

  cs = computed(() => {
    const m = this.match();
    return m ? m.totalMinionsKilled + m.neutralMinionsKilled : 0;
  });

  csPerMin = computed(() => {
    const m = this.match();
    if (!m || m.gameDurationSeconds === 0) return 0;
    return ((m.totalMinionsKilled + m.neutralMinionsKilled) / (m.gameDurationSeconds / 60));
  });

  kda = computed(() => {
    const m = this.match();
    if (!m) return 0;
    return m.deaths > 0 ? (m.kills + m.assists) / m.deaths : (m.kills + m.assists);
  });

  multikillLabel = computed(() => {
    const m = this.match();
    if (!m) return '';
    if (m.pentaKills > 0) return 'PENTA KILL 🎯';
    if (m.quadraKills > 0) return 'QUADRA KILL';
    if (m.tripleKills > 0) return 'TRIPLE KILL';
    if (m.doubleKills > 0) return 'DOUBLE KILL';
    return '';
  });

  parsedReviewSections = computed(() => {
    const raw = this.reviewText();
    if (!raw) return null;
    const applause = this.extractSection(raw, '👏 Applause');
    const critique = this.extractSection(raw, '🔍 Constructive Criticism');
    const focus = this.extractSection(raw, '💡 Tactical Focus for Next Game');
    return { applause, critique, focus };
  });

  private extractSection(text: string, header: string): string {
    const regex = new RegExp(`###\\s*${header.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\n([\\s\\S]*?)(?=###|$)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  }

  ngOnInit() {
    this.matchId.set(this.route.snapshot.paramMap.get('matchId') ?? '');
    this.puuid.set(this.route.snapshot.queryParamMap.get('puuid') ?? '');
    this.fetchMatch();
  }

  fetchMatch() {
    this.loadingMatch.set(true);
    this.matchError.set('');
    const url = `${environment.apiBaseUrl}/api/profile/match/${this.matchId()}?puuid=${this.puuid()}`;
    this.http.get<DetailedMatch>(url).subscribe({
      next: (data) => {
        this.match.set(data);
        this.loadingMatch.set(false);
      },
      error: (err) => {
        this.matchError.set('Failed to load match details. Please try again.');
        this.loadingMatch.set(false);
        console.error(err);
      }
    });
  }

  requestReview() {
    if (this.loadingReview()) return;
    this.reviewRequested.set(true);
    this.loadingReview.set(true);
    this.reviewError.set('');
    const url = `${environment.apiBaseUrl}/api/profile/match/${this.matchId()}/review?puuid=${this.puuid()}`;
    this.http.get<{ review: string }>(url).subscribe({
      next: (data) => {
        this.reviewText.set(data.review);
        this.loadingReview.set(false);
      },
      error: (err) => {
        this.reviewError.set('AI review failed. Please try again.');
        this.loadingReview.set(false);
        console.error(err);
      }
    });
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  formatNumber(n: number): string {
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return n.toString();
  }

  formatLines(text: string): string[] {
    return text.split('\n').filter(l => l.trim().length > 0);
  }

  cleanLine(line: string): string {
    return line.replace(/^\s*[-*]\s*/, '').replace(/\*\*/g, '').trim();
  }

  isBoldLine(line: string): boolean {
    return /^\s*[-*]\s*\*\*/.test(line);
  }

  getBoldPart(line: string): string {
    const m = line.match(/\*\*([^*]+)\*\*/);
    return m ? m[1] : '';
  }

  getRestPart(line: string): string {
    return line.replace(/^\s*[-*]\s*/, '').replace(/\*\*[^*]+\*\*:?\s*/, '').trim();
  }
}
