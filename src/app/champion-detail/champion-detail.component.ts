import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

interface ChampionSpell {
  key: string;
  name: string;
  description: string;
  iconUrl: string;
}

interface ChampionMatch {
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
}

interface ChampionDetail {
  championId: string;
  championName: string;
  championTitle: string;
  lore: string;
  tags: string[];
  imageUrl: string;
  splashUrl: string;
  currentPatch: string;
  passive: ChampionSpell;
  spells: ChampionSpell[];
  championMatches: ChampionMatch[];
  masteryData: {
    championName: string;
    championLevel: number;
    championPoints: number;
  } | null;
}

@Component({
  selector: 'app-champion-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './champion-detail.component.html',
  styleUrls: ['./champion-detail.component.css']
})
export class ChampionDetailComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  championName = signal('');
  puuid = signal('');
  region = signal('');

  detail = signal<ChampionDetail | null>(null);
  loading = signal(true);
  error = signal('');

  coachingText = signal('');
  loadingCoaching = signal(false);
  coachingError = signal('');
  coachingRequested = signal(false);

  allSpells = computed(() => {
    const d = this.detail();
    if (!d) return [];
    const passive = d.passive?.name ? [d.passive] : [];
    return [...passive, ...(d.spells ?? [])];
  });

  stats = computed(() => {
    const matches = this.detail()?.championMatches ?? [];
    if (matches.length === 0) return null;
    const wins = matches.filter(m => m.win).length;
    const avgK = matches.reduce((s, m) => s + m.kills, 0) / matches.length;
    const avgD = matches.reduce((s, m) => s + m.deaths, 0) / matches.length;
    const avgA = matches.reduce((s, m) => s + m.assists, 0) / matches.length;
    const kda = avgD > 0 ? (avgK + avgA) / avgD : avgK + avgA;
    return {
      played: matches.length,
      wins,
      losses: matches.length - wins,
      winRate: Math.round((wins / matches.length) * 100),
      avgK: avgK.toFixed(1),
      avgD: avgD.toFixed(1),
      avgA: avgA.toFixed(1),
      kda: kda.toFixed(2)
    };
  });

  parsedCoaching = computed(() => {
    const raw = this.coachingText();
    if (!raw) return null;
    const strengths  = this.extractSection(raw, ['Strengths']);
    const weaknesses = this.extractSection(raw, ['Key Weaknesses', 'Weaknesses']);
    const drill      = this.extractSection(raw, ['Challenger Drill', 'Drill']);
    // If all sections are empty the regex split failed — fall back to raw display
    if (!strengths && !weaknesses && !drill) {
      return { strengths: '', weaknesses: '', drill: '', raw };
    }
    return { strengths, weaknesses, drill, raw: '' };
  });

  // Split on ### markers and match by keyword (emoji-safe)
  private extractSection(text: string, keywords: string[]): string {
    const parts = text.split(/###\s*/); // split on '### '
    for (const part of parts) {
      const firstLine = part.split('\n')[0].toLowerCase();
      for (const kw of keywords) {
        if (firstLine.includes(kw.toLowerCase())) {
          const afterHeader = part.substring(part.indexOf('\n') + 1);
          return afterHeader.trim();
        }
      }
    }
    return '';
  }

  ngOnInit() {
    this.championName.set(decodeURIComponent(this.route.snapshot.paramMap.get('championName') ?? ''));
    this.puuid.set(this.route.snapshot.queryParamMap.get('puuid') ?? '');
    this.region.set(this.route.snapshot.queryParamMap.get('region') ?? 'EUW1');
    this.fetchDetail();
  }

  fetchDetail() {
    this.loading.set(true);
    this.error.set('');
    const url = `${environment.apiBaseUrl}/api/profile/champion/${encodeURIComponent(this.championName())}?puuid=${this.puuid()}&region=${this.region()}`;
    this.http.get<ChampionDetail>(url).subscribe({
      next: d => { this.detail.set(d); this.loading.set(false); },
      error: err => { this.error.set('Failed to load champion data.'); this.loading.set(false); console.error(err); }
    });
  }

  requestCoaching() {
    if (this.loadingCoaching()) return;
    this.coachingRequested.set(true);
    this.loadingCoaching.set(true);
    this.coachingError.set('');
    const url = `${environment.apiBaseUrl}/api/profile/champion/${encodeURIComponent(this.championName())}/coaching?puuid=${this.puuid()}&region=${this.region()}`;
    this.http.get<{ coaching: string }>(url).subscribe({
      next: r => { this.coachingText.set(r.coaching); this.loadingCoaching.set(false); },
      error: err => { this.coachingError.set('Coaching request failed.'); this.loadingCoaching.set(false); console.error(err); }
    });
  }

  navigateToMatch(matchId: string) {
    this.router.navigate(['/match', matchId], { queryParams: { puuid: this.puuid() } });
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  formatPoints(pts: number): string {
    if (pts >= 1_000_000) return (pts / 1_000_000).toFixed(1) + 'M';
    if (pts >= 1000) return (pts / 1000).toFixed(0) + 'k';
    return pts.toString();
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
