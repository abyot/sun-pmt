package org.hisp.dhis.datastatistics.hibernate;

/*
 * Copyright (c) 2004-2016, University of Oslo
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 * Redistributions of source code must retain the above copyright notice, this
 * list of conditions and the following disclaimer.
 *
 * Redistributions in binary form must reproduce the above copyright notice,
 * this list of conditions and the following disclaimer in the documentation
 * and/or other materials provided with the distribution.
 * Neither the name of the HISP project nor the names of its contributors may
 * be used to endorse or promote products derived from this software without
 * specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import org.hisp.dhis.datastatistics.AggregatedStatistics;
import org.hisp.dhis.datastatistics.DataStatistics;
import org.hisp.dhis.datastatistics.DataStatisticsStore;
import org.hisp.dhis.datastatistics.EventInterval;
import org.hisp.dhis.hibernate.HibernateGenericStore;
import org.hisp.dhis.system.util.DateUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import org.apache.commons.lang3.StringUtils;

import java.util.Date;
import java.util.List;

/**
 * @author Yrjan A. F. Fraschetti
 * @author Julie Hill Roa
 */
public class HibernateDataStatisticsStore
    extends HibernateGenericStore<DataStatistics>
    implements DataStatisticsStore
{
    @Autowired
    private JdbcTemplate jdbcTemplate;

    // -------------------------------------------------------------------------
    // DataStatisticsStore implementation
    // -------------------------------------------------------------------------

    @Override
    public List<AggregatedStatistics> getSnapshotsInInterval( EventInterval eventInterval, Date startDate, Date endDate )
    {
        final String sql = getQuery( eventInterval, startDate, endDate );

        return jdbcTemplate.query( sql, ( resultSet, i ) -> {

            AggregatedStatistics ads = new AggregatedStatistics();

            ads.setYear( resultSet.getInt( "yr" ) );

            if ( eventInterval == EventInterval.DAY )
            {
                ads.setDay( resultSet.getInt( "day" ) );
                ads.setMonth( resultSet.getInt( "mnt" ) );
            }
            else if ( eventInterval == EventInterval.WEEK )
            {
                ads.setWeek( resultSet.getInt( "week" ) );
            }
            else if ( eventInterval == EventInterval.MONTH )
            {
                ads.setMonth( resultSet.getInt( "mnt" ) );
            }

            ads.setActiveUsers( resultSet.getInt( "activeUsers" ) );
            ads.setMapViews( resultSet.getInt( "mapViews" ) );
            ads.setChartViews( resultSet.getInt( "chartViews" ) );
            ads.setReportTablesViews( resultSet.getInt( "reportTablesViews" ) );
            ads.setEventReportViews( resultSet.getInt( "reportTablesViews" ) );
            ads.setEventChartViews( resultSet.getInt( "eventChartViews" ) );
            ads.setDashboardViews( resultSet.getInt( "dashboardViews" ) );
            ads.setIndicatorsViews( resultSet.getInt( "indicatorsViews" ) );
            ads.setTotalViews( resultSet.getInt( "totalViews" ) );
            ads.setAverageViews( resultSet.getInt( "averageViews" ) );
            ads.setSavedMaps( resultSet.getInt( "savedMaps" ) );
            ads.setSavedCharts( resultSet.getInt( "savedCharts" ) );
            ads.setSavedReportTables( resultSet.getInt( "savedReportTables" ) );
            ads.setSavedEventReports( resultSet.getInt( "savedEventReports" ) );
            ads.setSavedEventCharts( resultSet.getInt( "savedEventCharts" ) );
            ads.setSavedDashboards( resultSet.getInt( "savedDashboards" ) );
            ads.setSavedIndicators( resultSet.getInt( "savedIndicators" ) );
            ads.setusers( resultSet.getInt( "users" ) );

            return ads;
        } );
    }

    private String getQuery( EventInterval eventInterval, Date startDate, Date endDate )
    {
        String sql = StringUtils.EMPTY;

        if ( eventInterval == EventInterval.DAY )
        {
            sql = getDaySql( startDate, endDate );
        }
        else if ( eventInterval == EventInterval.WEEK )
        {
            sql = getWeekSql( startDate, endDate );
        }
        else if ( eventInterval == EventInterval.MONTH )
        {
            sql = getMonthSql( startDate, endDate );
        }
        else if ( eventInterval == EventInterval.YEAR )
        {
            sql = getYearSql( startDate, endDate );
        }
        else
        {
            sql = getDaySql( startDate, endDate );
        }

        return sql;
    }

    /**
     * Creating a SQL for retrieving aggregated data with group by YEAR
     *
     * @param start start date
     * @param end   end date
     * @return SQL string
     */
    private String getYearSql( Date start, Date end )
    {
        return "select extract(year from created) as yr, " +
            commonSql( start, end ) + " order by yr;";
    }

    /**
     * Creating a SQL for retrieving aggregated data with group by YEAR, MONTH
     *
     * @param start start date
     * @param end   end date
     * @return SQL string
     */
    private String getMonthSql( Date start, Date end )
    {
        return "select extract(year from created) as yr, " +
            "extract(month from created) as mnt, " +
            commonSql( start, end ) + ", mnt order by yr, mnt;";
    }

    /**
     * Creating a SQL for retrieving aggregated data with group by YEAR, WEEK
     *
     * @param start start date
     * @param end   end date
     * @return SQL string
     */
    private String getWeekSql( Date start, Date end )
    {
        return "select extract(year from created) as yr, " +
            "extract(week from created) as week, " +
            commonSql( start, end ) + ", week order by yr, week;";
    }

    /**
     * Creating a SQL for retrieving aggregated data with group by YEAR, DAY
     *
     * @param start start date
     * @param end   end date
     * @return SQL string
     */
    private String getDaySql( Date start, Date end )
    {
        return "select extract(year from created) as yr, " +
            "extract(month from created) as mnt," +
            "extract(day from created) as day, " +
            commonSql( start, end ) + ", mnt, day order by yr, mnt, day;";
    }

    /**
     * Part of SQL witch is always the same in the different intervals YEAR,
     * MONTH, WEEK and DAY
     *
     * @param start start date
     * @param end   end date
     * @return SQL string
     */
    private String commonSql( Date start, Date end )
    {
        return "max(active_users) as activeUsers," +
            "cast(round(cast(sum(mapviews) as numeric),0) as int) as mapViews," +
            "cast(round(cast(sum(chartviews) as numeric),0) as int) as chartViews," +
            "cast(round(cast(sum(reporttableviews) as numeric),0) as int) as reportTablesViews, " +
            "cast(round(cast(sum(eventreportviews) as numeric),0) as int) as eventReportViews, " +
            "cast(round(cast(sum(eventchartviews) as numeric),0) as int) as eventChartViews," +
            "cast(round(cast(sum(dashboardviews) as numeric),0) as int) as dashboardViews, " +
            "cast(round(cast(sum(indicatorviews) as numeric),0) as int) as indicatorsViews, " +
            "cast(round(cast(sum(totalviews) as numeric),0) as int) as totalViews," +
            "cast(round(cast(sum(average_views) as numeric),0) as int) as averageViews, " +
            "cast(round(cast(sum(maps) as numeric),0) as int) as savedMaps," +
            "cast(round(cast(sum(charts) as numeric),0) as int) as savedCharts," +
            "cast(round(cast(sum(reporttables) as numeric),0) as int) as savedReportTables," +
            "cast(round(cast(sum(eventreports) as numeric),0) as int) as savedEventReports," +
            "cast(round(cast(sum(eventcharts) as numeric),0) as int) as savedEventCharts," +
            "cast(round(cast(sum(dashborards) as numeric),0) as int) as savedDashboards, " +
            "cast(round(cast(sum(indicators) as numeric),0) as int) as savedIndicators," +
            "max(users) as users from datastatistics " +
            "where (created between '" + DateUtils.getMediumDateString( start ) +
            "' and '" + DateUtils.getMediumDateString( end ) + "') " +
            "group by yr";
    }
}
