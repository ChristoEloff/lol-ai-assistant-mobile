import { Routes } from '@angular/router';
import { MainLayoutComponent } from './main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'home',
        loadComponent: () => import('./dashboard-home/dashboard-home.component').then(m => m.DashboardHomeComponent)
      },
      {
        path: 'match/:matchId',
        loadComponent: () => import('./match-detail/match-detail.component').then(m => m.MatchDetailComponent)
      },
      {
        path: 'champion/:championName',
        loadComponent: () => import('./champion-detail/champion-detail.component').then(m => m.ChampionDetailComponent)
      }
    ]
  },
  {
    path: 'overlay',
    loadComponent: () => import('./overlay/overlay.component').then(m => m.OverlayComponent)
  }
];
