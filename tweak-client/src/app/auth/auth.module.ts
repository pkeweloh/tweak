import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from '../material/material.module';
import { AuthService } from '../shared/services/auth.service';
import { AuthRoutingModule } from './auth-routing.module';
import { AuthComponent } from './auth.component';
import { LoginComponent } from './login/login.component';

@NgModule({
  declarations: [AuthComponent, LoginComponent],
  imports: [
    CommonModule,
    AuthRoutingModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
  ],
  providers: [AuthService],
  exports: [],
})
export class AuthModule {}
