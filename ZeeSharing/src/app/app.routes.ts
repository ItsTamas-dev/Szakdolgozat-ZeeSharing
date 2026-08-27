import { Routes } from '@angular/router';
import { AuthGuard } from './comps/auth/auth.guard';
import { MainComponent } from './comps/main/main.component';
import { LoginComponent } from './comps/login/login.component';
import { RegisterComponent } from './comps/register/register.component';
import { OfflineMainComponent } from './comps/offline-main/offline-main.component';
export const routes: Routes = [
    { path: '', component: LoginComponent },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'offline-main', component: OfflineMainComponent },
    { path: 'main', component: MainComponent, canActivate: [AuthGuard] },
];

