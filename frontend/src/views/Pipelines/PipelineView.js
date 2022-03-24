import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Box,
  Breadcrumbs,
  Button,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Link,
  Tab,
  Tabs,
  Typography
} from '@material-ui/core';
import { FaAws, FaTrash } from 'react-icons/all';
import { useNavigate } from 'react-router';
import * as PropTypes from 'prop-types';
import { useSnackbar } from 'notistack';
import { ForumOutlined, Info, LocalOffer, PlaylistPlay } from '@material-ui/icons';
import useSettings from '../../hooks/useSettings';
import useClient from '../../hooks/useClient';
import ChevronRightIcon from '../../icons/ChevronRight';
import Stack from '../Stack/Stack';
import { SET_ERROR } from '../../store/errorReducer';
import { useDispatch } from '../../store';
import PipelineOverview from './PipelineOverview';
import PencilAltIcon from '../../icons/PencilAlt';
import DeleteObjectWithFrictionModal from '../../components/DeleteObjectWithFrictionModal';
import deleteSqlPipeline from '../../api/SqlPipeline/deleteSqlPipeline';
import getSqlPipeline from '../../api/SqlPipeline/getSqlPipeline';
import PipelineRuns from './PipelineRuns';
import StackStatus from '../Stack/StackStatus';
import KeyValueTagList from '../KeyValueTags/KeyValueTagList';
import FeedComments from '../Feed/FeedComments';

const tabs = [
  { label: 'Overview', value: 'overview', icon: <Info fontSize="small" /> },
  { label: 'Execution', value: 'runs', icon: <PlaylistPlay fontSize="small" /> },
  { label: 'Tags', value: 'tags', icon: <LocalOffer fontSize="small" /> },
  { label: 'Stack', value: 'stack', icon: <FaAws size={20} /> }
];

function PipelineViewPageHeader({ pipeline, deletePipeline }) {
  const [openFeed, setOpenFeed] = useState(false);
  return (
    <Grid
      container
      justifyContent="space-between"
      spacing={3}
    >
      <Grid item>
        <Typography
          color="textPrimary"
          variant="h5"
        >
          Pipeline
          {' '}
          {pipeline.label}
        </Typography>
        <Breadcrumbs
          aria-label="breadcrumb"
          separator={<ChevronRightIcon fontSize="small" />}
          sx={{ mt: 1 }}
        >
          <Typography
            color="textPrimary"
            variant="subtitle2"
          >
            Play
          </Typography>
          <Link
            color="textPrimary"
            component={RouterLink}
            to="/console/pipelines"
            variant="subtitle2"
          >
            Pipelines
          </Link>
          <Link
            color="textPrimary"
            component={RouterLink}
            to={`/console/pipelines/${pipeline.sqlPipelineUri}`}
            variant="subtitle2"
          >
            {pipeline.label}
          </Link>
        </Breadcrumbs>
      </Grid>
      <Grid item>
        <Box sx={{ m: -1 }}>
          <Button
            color="primary"
            startIcon={<ForumOutlined fontSize="small" />}
            sx={{ mt: 1, mr: 1 }}
            onClick={() => setOpenFeed(true)}
            type="button"
            variant="outlined"
          >
            Chat
          </Button>
          <Button
            color="primary"
            component={RouterLink}
            startIcon={<PencilAltIcon fontSize="small" />}
            sx={{ mt: 1, mr: 1 }}
            to={`/console/pipelines/${pipeline.sqlPipelineUri}/edit`}
            variant="outlined"
          >
            Edit
          </Button>
          <Button
            color="primary"
            startIcon={<FaTrash size={15} />}
            sx={{ mt: 1 }}
            onClick={deletePipeline}
            type="button"
            variant="outlined"
          >
            Delete
          </Button>
        </Box>
      </Grid>
      {openFeed && (
      <FeedComments
        objectOwner={pipeline.owner}
        targetType="SqlPipeline"
        targetUri={pipeline.sqlPipelineUri}
        open={openFeed}
        onClose={() => setOpenFeed(false)}
      />
      )}
    </Grid>
  );
}

PipelineViewPageHeader.propTypes = {
  pipeline: PropTypes.object.isRequired,
  deletePipeline: PropTypes.func.isRequired
};
const PipelineView = () => {
  const dispatch = useDispatch();
  const { settings } = useSettings();
  const { enqueueSnackbar } = useSnackbar();
  const params = useParams();
  const client = useClient();
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [pipeline, setPipeline] = useState(null);
  const [stack, setStack] = useState(null);
  const [isDeleteObjectModalOpen, setIsDeleteObjectModalOpen] = useState(false);
  const handleDeleteObjectModalOpen = () => {
    setIsDeleteObjectModalOpen(true);
  };

  const handleDeleteObjectModalClose = () => {
    setIsDeleteObjectModalOpen(false);
  };

  const fetchItem = async () => {
    setLoading(true);
    const response = await client.query(getSqlPipeline(params.uri));
    if (!response.errors && response.data.getSqlPipeline !== null) {
      setPipeline(response.data.getSqlPipeline);
      if (stack) {
        setStack(response.data.getSqlPipeline.stack);
      }
    } else {
      const error = response.errors ? response.errors[0].message : 'Pipeline not found';
      dispatch({ type: SET_ERROR, error });
    }
    setLoading(false);
  };
  useEffect(() => {
    if (client) {
      fetchItem().catch((e) => dispatch({ type: SET_ERROR, error: e.message }));
    }
  }, [client]);

  const handleTabsChange = (event, value) => {
    setCurrentTab(value);
  };

  const deletePipeline = async (deleteFromAWS = false) => {
    const response = await client.mutate(deleteSqlPipeline({ sqlPipelineUri: pipeline.sqlPipelineUri, deleteFromAWS }));
    if (!response.errors) {
      handleDeleteObjectModalClose();
      enqueueSnackbar('Pipeline deleted', {
        anchorOrigin: {
          horizontal: 'right',
          vertical: 'top'
        },
        variant: 'success'
      });
      navigate('/console/pipelines');
    } else {
      dispatch({ type: SET_ERROR, error: response.errors[0].message });
    }
  };

  if (loading) {
    return <CircularProgress />;
  }
  if (!pipeline) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Pipelines: Pipelines Details | data.all</title>
      </Helmet>
      <StackStatus
        stack={stack}
        setStack={setStack}
        environmentUri={pipeline.environment?.environmentUri}
      />
      <Box
        sx={{
          backgroundColor: 'background.default',
          minHeight: '100%',
          py: 8
        }}
      >
        <Container maxWidth={settings.compact ? 'xl' : false}>
          <PipelineViewPageHeader
            pipeline={pipeline}
            deletePipeline={handleDeleteObjectModalOpen}
          />
          <Box sx={{ mt: 3 }}>
            <Tabs
              indicatorColor="primary"
              onChange={handleTabsChange}
              scrollButtons="auto"
              textColor="primary"
              value={currentTab}
              variant="scrollable"
            >
              {tabs.map((tab) => (
                <Tab
                  key={tab.value}
                  label={tab.label}
                  value={tab.value}
                  icon={settings.tabIcons ? tab.icon : null}
                />
              ))}
            </Tabs>
          </Box>
          <Divider />
          <Box sx={{ mt: 3 }}>
            {currentTab === 'overview'
            && <PipelineOverview pipeline={pipeline} />}
            {currentTab === 'runs'
            && <PipelineRuns pipeline={pipeline} />}
            {currentTab === 'tags'
            && (
            <KeyValueTagList
              targetUri={pipeline.sqlPipelineUri}
              targetType="pipeline"
            />
            )}
            {currentTab === 'stack'
            && (
            <Stack
              environmentUri={pipeline.environment.environmentUri}
              stackUri={pipeline.stack.stackUri}
              targetUri={pipeline.sqlPipelineUri}
              targetType="pipeline"
            />
            )}
          </Box>
        </Container>
      </Box>
      <DeleteObjectWithFrictionModal
        objectName={pipeline.label}
        onApply={handleDeleteObjectModalClose}
        onClose={handleDeleteObjectModalClose}
        open={isDeleteObjectModalOpen}
        deleteFunction={deletePipeline}
        isAWSResource
      />
    </>
  );
};

export default PipelineView;
