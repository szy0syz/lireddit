import React from 'react';
import { Flex, IconButton } from '@chakra-ui/core';
import { PostSnippetFragment } from '../generated/graphql';

interface UpdootSectionProps {
  //   post: PostsQuery['posts']['posts'][0];
  post: PostSnippetFragment;
}

const UpdootSection: React.FC<UpdootSectionProps> = ({ post }) => {
  return (
    <Flex direction="column" mr={4} alignItems="center">
      <IconButton
        onClick={() => console.log('~')}
        icon="chevron-up"
        aria-label="up"
      />
      {post.points}
      <IconButton
        onClick={() => console.log('~')}
        icon="chevron-down"
        aria-label="down"
      />
    </Flex>
  );
};

export default UpdootSection;
