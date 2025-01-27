import { HeaderLogo } from '@/components/HeaderLogo'
import AuthLayout from '@/components/layouts/AuthLayout'
import { Form } from '@/ui/forms/Form'
import { useZodForm } from '@/lib/hooks/useZodForm'
import { Input } from '@/ui/forms/Input'
import { Link } from '@/ui/Link'
import Image from 'next/image'
import { resetPasswordSchema, userService } from '@/lib/api/user'
import { getObjectKeys } from '@/utils/helpers'
import { NextPageWithLayout } from '@/lib/types/app'
import { Button } from '@/ui/Button'
import { useDialog } from '@/lib/hooks/useDialog'
import { SuccessDialog } from '@/components/dialogs/SuccessDialog'
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import { z } from 'zod'

type ResetPasswordPageProps = InferGetServerSidePropsType<
  typeof getServerSideProps
>

const ResetPasswordPage: NextPageWithLayout<ResetPasswordPageProps> = ({
  token,
  isValid
}) => {
  const [openDialog, closeDialog] = useDialog()
  const resetPasswordForm = useZodForm({
    schema: resetPasswordSchema,
    defaultValues: {
      token: token
    }
  })

  return (
    <>
      <HeaderLogo header="Reset Password" />
      {token && isValid ? (
        <>
          <h2 className="mb-5 mt-10 text-center text-xl font-semibold text-green">
            Provide a new password for your Testnet account.
          </h2>
          <div className="w-2/3">
            <Form
              form={resetPasswordForm}
              onSubmit={async (data) => {
                const response = await userService.resetPassword(data)

                if (response.success) {
                  openDialog(
                    <SuccessDialog
                      onClose={closeDialog}
                      title="New password set."
                      content="Please login with your new password."
                      redirect={'/auth/login'}
                      redirectText="Go to Login"
                    />
                  )
                } else {
                  const { errors, message } = response
                  resetPasswordForm.setError('root', { message })

                  if (errors) {
                    getObjectKeys(errors).map((field) =>
                      resetPasswordForm.setError(field, {
                        message: errors[field]
                      })
                    )
                  }
                }
              }}
            >
              <Input
                required
                type="password"
                {...resetPasswordForm.register('password')}
                error={resetPasswordForm.formState.errors.password?.message}
                label="Password"
              />
              <Input
                required
                type="password"
                {...resetPasswordForm.register('confirmPassword')}
                error={
                  resetPasswordForm.formState.errors.confirmPassword?.message
                }
                label="Confirm password"
              />
              <Input
                required
                type="hidden"
                {...resetPasswordForm.register('token')}
              />
              <div className="flex justify-evenly py-5">
                <Button
                  aria-label="Reset Password"
                  type="submit"
                  loading={resetPasswordForm.formState.isSubmitting}
                >
                  Reset
                </Button>
                <Button
                  intent="secondary"
                  aria-label="cancel"
                  href="/auth/login"
                >
                  Cancel
                </Button>
              </div>
            </Form>
          </div>
        </>
      ) : (
        <h2 className="mb-5 mt-10 text-center text-xl font-semibold text-green">
          The link is invalid or has expired. <br /> Please verify your link, or{' '}
          <Link href="/auth/forgot" className="font-medium underline">
            request a new link
          </Link>{' '}
          to reset password again.
        </h2>
      )}

      <Image
        className="mt-auto object-cover md:hidden"
        src="/welcome-mobile.webp"
        alt="Forgot password"
        quality={100}
        width={400}
        height={200}
      />
      <p className="mt-auto font-extralight text-green">
        Remembered your credentials?{' '}
        <Link href="/auth/login" className="font-medium underline">
          Login
        </Link>
      </p>
    </>
  )
}

const querySchema = z.object({
  token: z.string()
})

export const getServerSideProps: GetServerSideProps<{
  token: string
  isValid: boolean
}> = async (ctx) => {
  const result = querySchema.safeParse(ctx.query)

  if (!result.success) {
    return {
      notFound: true
    }
  }

  const checkTokenResponse = await userService.checkToken(
    result.data.token,
    ctx.req.headers.cookie
  )

  if (!checkTokenResponse.success || !checkTokenResponse.data) {
    return {
      notFound: true
    }
  }

  return {
    props: {
      token: result.data.token,
      isValid: checkTokenResponse.data.isValid
    }
  }
}

ResetPasswordPage.getLayout = function (page) {
  return <AuthLayout image="Park">{page}</AuthLayout>
}

export default ResetPasswordPage
