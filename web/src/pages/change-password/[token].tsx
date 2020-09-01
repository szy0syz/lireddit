import { NextPage } from 'next';
import Wrapper from '../../components/Wrapper';
import { Formik, Form } from 'formik';
import { toErrorMap } from '../../utils/toErrorMap';
import InputField from '../../components/InputField';
import { Button, Box } from '@chakra-ui/core';
import { useChangePasswordMutation } from '../../generated/graphql';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { withUrqlClient } from 'next-urql';
import { createUrqlClient } from '../../utils/createUrqlClient';

const ChangePassowrd: NextPage<{ token: string }> = ({ token }) => {
  const  router = useRouter();
  const [tokenError, setTokenError] = useState('');
  const [, ChangePassowrd] = useChangePasswordMutation();
  return (
    <Wrapper>
      <Formik
        initialValues={{ newPassword: '' }}
        onSubmit={async (values, { setErrors }) => {
          const response = await ChangePassowrd({
            newPassword: values.newPassword,
            token,
          });
          if (response.data?.changePassword.errors) {
            const errorMap = toErrorMap(response.data.changePassword.errors);
            if ('token' in errorMap) {
              setTokenError(errorMap.token);
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
              name="newPassword"
              placeholder="new password"
              label="new password"
              type="password"
            />
            {tokenError && <Box color="red">{tokenError}</Box>}
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

export default withUrqlClient(createUrqlClient, { ssr: false })(ChangePassowrd);
