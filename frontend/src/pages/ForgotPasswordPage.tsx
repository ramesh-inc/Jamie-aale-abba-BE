import ForgotPasswordForm from '../components/auth/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return (
    <ForgotPasswordForm
      onCancel={() => {
        window.location.href = '/login';
      }}
    />
  );
}