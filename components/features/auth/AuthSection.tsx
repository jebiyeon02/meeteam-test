import BaseInput from '@/components/shared/BaseInput';
import BaseField from '@/components/shared/BaseField';
import BaseButton from '@/components/shared/BaseButton';

type AuthSectionProps = {
  email: string;
  password: string;
  passwordConfirm: string;
  onChangeEmail: React.ChangeEventHandler<HTMLInputElement>;
  onChangePassword: React.ChangeEventHandler<HTMLInputElement>;
  onChangePasswordConfirm: React.ChangeEventHandler<HTMLInputElement>;
  onCheckEmail: () => void;
  emailFeedback?: string;
  emailFeedbackTone?: 'default' | 'success' | 'error';
  emailError?: string;
  passwordError?: string;
  isCheckingEmail: boolean;
};

export default function AuthSection({
  email,
  password,
  passwordConfirm,
  onChangeEmail,
  onChangePassword,
  onChangePasswordConfirm,
  onCheckEmail,
  emailFeedback,
  emailFeedbackTone = 'default',
  emailError,
  passwordError,
  isCheckingEmail,
}: AuthSectionProps) {
  const emailHintText = !emailError && emailFeedbackTone === 'default' ? emailFeedback : undefined;
  const emailMessageClassName =
    emailFeedbackTone === 'success'
      ? 'text-mt-primary'
      : emailFeedbackTone === 'error'
        ? 'text-mt-hero-blue'
        : 'text-mt-text-secondary';

  return (
    <>
      <BaseField label="이메일" htmlFor="email" errorText={emailError} hintText={emailHintText}>
        <div className="flex gap-2">
          <BaseInput
            id="email"
            type="email"
            value={email}
            placeholder="example@email.com"
            onChange={onChangeEmail}
            data-cy="signup-email"
          />
          <BaseButton
            type="button"
            variant="gray"
            size="M"
            onClick={onCheckEmail}
            disabled={!email.trim() || isCheckingEmail}
            className="shrink-0 border-none bg-mt-badge-bg text-mt-primary"
            data-cy="signup-email-check"
          >
            <span className="font-bold">{isCheckingEmail ? '확인 중...' : '중복 확인'}</span>
          </BaseButton>
        </div>
      </BaseField>

      {emailFeedback && emailFeedbackTone !== 'default' ? (
        <p className={`text-sm ${emailMessageClassName}`}>{emailFeedback}</p>
      ) : null}

      <div className="flex gap-4">
        <BaseField label="비밀번호" htmlFor="password">
          <BaseInput
            id="password"
            type="password"
            value={password}
            placeholder="8자 이상 입력"
            onChange={onChangePassword}
            data-cy="signup-password"
          />
        </BaseField>
        <BaseField label="비밀번호 확인" htmlFor="passwordConfirm" errorText={passwordError}>
          <BaseInput
            id="passwordConfirm"
            type="password"
            value={passwordConfirm}
            placeholder="비밀번호 재입력"
            onChange={onChangePasswordConfirm}
            data-cy="signup-password-confirm"
          />
        </BaseField>
      </div>
    </>
  );
}
