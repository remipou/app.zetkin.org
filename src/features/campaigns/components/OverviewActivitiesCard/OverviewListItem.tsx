import makeStyles from '@mui/styles/makeStyles';
import NextLink from 'next/link';
import { OverridableComponent } from '@mui/material/OverridableComponent';
import {
  Box,
  Grid,
  Link,
  SvgIconTypeMap,
  Theme,
  Typography,
} from '@mui/material';

import { CampaignActivity } from 'features/campaigns/models/CampaignActivitiesModel';
import { isSameDate } from 'utils/dateUtils';
import messageIds from 'features/campaigns/l10n/messageIds';
import { Msg } from 'core/i18n';
import theme from 'theme';
import ZUIIconLabel from 'zui/ZUIIconLabel';
import ZUIRelativeTime from 'zui/ZUIRelativeTime';

interface StyleProps {
  color: STATUS_COLORS;
}

const useStyles = makeStyles<Theme, StyleProps>((theme) => ({
  container: {
    alignItems: 'center',
    display: 'flex',
    padding: '1em',
  },
  dot: {
    backgroundColor: ({ color }) => theme.palette.statusColors[color],
    borderRadius: '100%',
    height: '10px',
    marginRight: '1em',
    width: '10px',
  },
  endNumber: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'flex-start',
  },
  left: {
    alignItems: 'center',
    display: 'flex',
  },

  primaryIcon: {
    color: theme.palette.grey[500],
    fontSize: '28px',
  },
  right: {
    alignItems: 'center',
    display: 'flex',
  },
  secondaryIcon: {
    color: theme.palette.grey[700],
    margin: '0 0.5em',
  },
}));

export enum STATUS_COLORS {
  BLUE = 'blue',
  GREEN = 'green',
  GRAY = 'gray',
  ORANGE = 'orange',
  RED = 'red',
}

interface OverviewListItemProps {
  PrimaryIcon: OverridableComponent<
    SvgIconTypeMap<Record<string, unknown>, 'svg'>
  >;
  SecondaryIcon: OverridableComponent<
    SvgIconTypeMap<Record<string, unknown>, 'svg'>
  >;

  activity: CampaignActivity;
  focusDate: Date | null;
  href: string;
  title: string;
  endNumber: string;
}

const OverviewListItem = ({
  activity,
  PrimaryIcon,
  SecondaryIcon,
  focusDate,
  href,
  title,
  endNumber,
}: OverviewListItemProps) => {
  const { endDate, startDate } = activity;
  const color = getStatusColor(activity);
  const classes = useStyles({ color });

  const now = new Date();
  let label: JSX.Element | null = null;

  if (!focusDate) {
    if (startDate) {
      label = getStartsLabel(startDate);
    } else if (endDate) {
      label = getEndsLabel(endDate);
    }
  } else if (startDate && isSameDate(focusDate, startDate)) {
    label = getStartsLabel(startDate);
  } else if (endDate && isSameDate(focusDate, endDate)) {
    label = getEndsLabel(endDate);
  }

  function getEndsLabel(endDate: Date) {
    if (endDate && isSameDate(endDate, now)) {
      return <Msg id={messageIds.activitiesCard.subtitles.endsToday} />;
    } else if (endDate && endDate > now) {
      return (
        <Msg
          id={messageIds.activitiesCard.subtitles.endsLater}
          values={{
            relative: <ZUIRelativeTime datetime={endDate.toISOString()} />,
          }}
        />
      );
    }

    return null;
  }

  function getStartsLabel(startDate: Date) {
    if (startDate && isSameDate(startDate, now)) {
      return <Msg id={messageIds.activitiesCard.subtitles.startsToday} />;
    } else if (startDate && startDate > now) {
      return (
        <Msg
          id={messageIds.activitiesCard.subtitles.startsLater}
          values={{
            relative: <ZUIRelativeTime datetime={startDate.toISOString()} />,
          }}
        />
      );
    }

    return null;
  }

  return (
    <Grid className={classes.container} container>
      <Grid item lg={8} md={7} xs={6}>
        <Box className={classes.left}>
          <PrimaryIcon className={classes.primaryIcon} />
          <NextLink href={href} passHref>
            <Link underline="none">
              <Typography
                color={theme.palette.text.primary}
                sx={{ paddingX: 2 }}
              >
                {title}
              </Typography>
            </Link>
          </NextLink>
        </Box>
      </Grid>
      <Grid item lg={2} md={3} xs={4}></Grid>
      <Grid item xs={2}>
        <Box className={classes.endNumber}>
          <ZUIIconLabel
            icon={<SecondaryIcon color="secondary" />}
            label={endNumber}
            labelColor="secondary"
          />
        </Box>
      </Grid>
      <Grid item lg={2} md={3} style={{ display: 'contents' }} xs={4}>
        <Grid>
          <Box style={{ marginTop: '5px' }}>
            <ZUIIconLabel
              icon={
                <Box
                  className={classes.dot}
                  style={{ alignSelf: 'center', margin: 'auto' }}
                ></Box>
              }
              label={label || ''}
              labelColor={theme.palette.grey[500]}
            />
          </Box>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default OverviewListItem;

function getStatusColor(activity: CampaignActivity): STATUS_COLORS {
  const now = new Date();
  const { endDate, startDate } = activity;

  if (startDate) {
    if (startDate > now) {
      return STATUS_COLORS.BLUE;
    } else if (startDate < now) {
      if (!endDate || endDate > now) {
        return STATUS_COLORS.GREEN;
      } else if (endDate && endDate < now) {
        // Should never happen, because it should not be
        // in the overview after it's closed.
        return STATUS_COLORS.RED;
      }
    }
  }

  // Should never happen, because it should not be in the
  // overview if it's not yet scheduled/published.
  return STATUS_COLORS.GRAY;
}
