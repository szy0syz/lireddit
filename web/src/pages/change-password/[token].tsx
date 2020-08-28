import { NextPage } from 'next';
import Wrapper from '../../components/Wrapper';
import { Formik, Form } from 'formik';
import { toErrorMap } from '../../utils/toErrorMap';
import InputField from '../../components/InputField';
import { Box, Button } from '@chakra-ui/core';
import { useChangePasswordMutation } from '../../generated/graphql';
import { useRouter } from 'next/router';

const ChangePassowrd: NextPage<{ token: string }> = ({ token }) => {
  const  router = useRouter();
  const [, ChangePassowrd] = useChangePasswordMutation();
  return (
    <Wrapper>
      <Formik
        initialValues={{ newPassowrd: '' }}
        onSubmit={async (values, { setErrors }) => {
          const response = await ChangePassowrd({
            newPassword: values.newPassowrd,
            token,
          });
          if (response.data?.changePassword.errors) {
            const errorMap = toErrorMap(response.data.changePassword.errors);
            if ('token' in errorMap) {

            }
            setErrors(errorMap);
          } else if (response.data?.changePassword.user) {
            // ok
            router.push('/');
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField
              name="newPassowrd"
              placeholder="new passowrd"
              label="new password"
            />
            <Button
              mt={4}
              type="submit"
              isLoading={isSubmitting}
              variantColor="teal"
            >
              change password
            </Button>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};

ChangePassowrd.getInitialProps = ({ query }) => {
  return {
    token: query.token as string,
  };
};

export default ChangePassowrd;
