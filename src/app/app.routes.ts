import { Routes } from '@angular/router';
import { authGuard } from '@core/auth/guards/auth.guard';
import { noAuthGuard } from '@core/auth/guards/no-auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    canActivate: [noAuthGuard],
    canActivateChild: [noAuthGuard],
    children: [
      {
        path: 'signin',
        loadComponent: () =>
          import(
            '@pages/authentication/sign-in/sign-in.component'
          ).then((m) => m.SignInComponent),
        title: 'Entrar · FutBet',
        data: { animation: 'signIn' },
      },
      {
        path: 'signup',
        loadComponent: () =>
          import(
            '@pages/authentication/sign-up/sign-up.component'
          ).then((m) => m.SignUpComponent),
        title: 'Cadastro · FutBet',
        data: { animation: 'signUp' },
      },
      { path: '', pathMatch: 'full', redirectTo: 'signin' },
    ],
  },
  {
    path: '',
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    loadComponent: () =>
      import('@layouts/main-layout/main-layout.component').then(
        (m) => m.MainLayoutComponent,
      ),
    children: [
      {
        path: 'tournaments',
        pathMatch: 'full',
        loadComponent: () =>
          import('@pages/my-tournaments/my-tournaments.component').then(
            (m) => m.MyTournamentsComponent,
          ),
        title: 'Meus torneios · FutBet',
      },
      {
        path: 'tournaments/public',
        loadComponent: () =>
          import(
            '@pages/public-tournaments/public-tournaments.component'
          ).then((m) => m.PublicTournamentsComponent),
        title: 'Torneios públicos · FutBet',
      },
      {
        path: 'teams',
        pathMatch: 'full',
        loadComponent: () =>
          import('@pages/my-teams/my-teams.component').then(
            (m) => m.MyTeamsComponent,
          ),
        title: 'Meus times · FutBet',
      },
      {
        path: 'teams/new',
        loadComponent: () =>
          import('@pages/create-team/create-team.component').then(
            (m) => m.CreateTeamComponent,
          ),
        title: 'Novo time · FutBet',
      },
      {
        path: 'teams/:id',
        loadComponent: () =>
          import('@pages/edit-team/edit-team.component').then(
            (m) => m.EditTeamComponent,
          ),
        title: 'Editar time · FutBet',
      },
      { path: '', pathMatch: 'full', redirectTo: 'tournaments' },
    ],
  },
  { path: '**', redirectTo: '' },
];
