#!/usr/bin/env python3
"""
NBA Data Fetcher for Basketball GM
Fetches real NBA player data from nba_api and generates game ratings.

Usage: python3 scripts/fetch-nba-data.py

Requirements: pip install nba_api requests beautifulsoup4
"""

import json
import time
import os
import sys
from datetime import datetime
from typing import Dict, List, Any, Optional

# Install dependencies if needed
try:
    from nba_api.stats.static import players, teams
    from nba_api.stats.endpoints import (
        commonplayerinfo,
        playercareerstats,
        commonteamroster,
        leaguedashplayerstats,
    )
except ImportError:
    print("Installing nba_api...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "nba_api", "--quiet", "--break-system-packages"])
    from nba_api.stats.static import players, teams
    from nba_api.stats.endpoints import (
        commonplayerinfo,
        playercareerstats,
        commonteamroster,
        leaguedashplayerstats,
    )

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("Installing requests and beautifulsoup4...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "requests", "beautifulsoup4", "--quiet", "--break-system-packages"])
    import requests
    from bs4 import BeautifulSoup

# Output directory
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'real')

# Team abbreviation mappings
TEAM_ABBREV_MAP = {
    'PHO': 'PHX', 'GS': 'GSW', 'SA': 'SAS', 'NY': 'NYK', 
    'NO': 'NOP', 'BRO': 'BKN', 'BK': 'BKN', 'UTAH': 'UTA',
    'NJ': 'BKN', 'CHA': 'CHA', 'CHO': 'CHA'
}

POSITION_MAP = {
    'Guard': 'PG', 'G': 'PG', 'Point Guard': 'PG',
    'Guard-Forward': 'SG', 'G-F': 'SG', 'Shooting Guard': 'SG',
    'Forward-Guard': 'SF', 'F-G': 'SF', 'Small Forward': 'SF',
    'Forward': 'SF', 'F': 'SF', 
    'Forward-Center': 'PF', 'F-C': 'PF', 'Power Forward': 'PF',
    'Center-Forward': 'C', 'C-F': 'C', 'Center': 'C', 'C': 'C',
}


def normalize_team_abbrev(abbrev: str) -> str:
    return TEAM_ABBREV_MAP.get(abbrev, abbrev)


def normalize_position(pos: str) -> str:
    if not pos:
        return 'SF'
    pos = pos.strip()
    if pos in POSITION_MAP:
        return POSITION_MAP[pos]
    parts = pos.split('-')
    if parts[0] in POSITION_MAP:
        return POSITION_MAP[parts[0]]
    return 'SF'


def clamp(value: float, min_val: float = 25, max_val: float = 99) -> int:
    return int(max(min_val, min(max_val, value)))


def calculate_player_ratings(stats: Dict, age: int, height: int, weight: int) -> Dict[str, int]:
    """Generate player ratings from real stats using regression methodology."""
    
    ppg = stats.get('pts', 0)
    rpg = stats.get('reb', 0)
    apg = stats.get('ast', 0)
    spg = stats.get('stl', 0)
    bpg = stats.get('blk', 0)
    mpg = stats.get('min', 0)
    fg_pct = stats.get('fg_pct', 0)
    fg3_pct = stats.get('fg3_pct', 0)
    ft_pct = stats.get('ft_pct', 0)
    tov = stats.get('tov', 0)
    fg3a = stats.get('fg3a', 0)
    fga = stats.get('fga', 1)
    fta = stats.get('fta', 0)
    
    if mpg > 0:
        pts_p36 = (ppg / mpg) * 36
        reb_p36 = (rpg / mpg) * 36
        ast_p36 = (apg / mpg) * 36
        stl_p36 = (spg / mpg) * 36
        blk_p36 = (bpg / mpg) * 36
        fta_p36 = (fta / mpg) * 36
    else:
        pts_p36 = reb_p36 = ast_p36 = stl_p36 = blk_p36 = fta_p36 = 0
    
    fg3_rate = fg3a / fga if fga > 0 else 0
    height_factor = (height - 69) / 22
    
    # Speed
    base_speed = 70 - (height_factor * 25) - ((weight - 180) / 10)
    age_speed_mod = max(0, (28 - age) * 0.8)
    speed = clamp(base_speed + age_speed_mod)
    
    # Other ratings
    strength = clamp(35 + (weight - 160) / 3 + min(age - 20, 8) * 1.5)
    jumping = clamp(60 + (height_factor * 10) - max(0, age - 28) * 2 + blk_p36 * 5)
    endurance = clamp(40 + mpg * 1.5)
    
    fg2_pct = (fg_pct * fga - fg3_pct * fg3a) / max(fga - fg3a, 1) if fga > fg3a else fg_pct
    inside_scoring = clamp(30 + fg2_pct * 50 + fta_p36 * 3 + height_factor * 10)
    mid_range = clamp(30 + fg_pct * 60 - fg3_rate * 10)
    three_point = clamp(25 + fg3_pct * 100 + min(fg3a, 8) * 2)
    free_throw = clamp(30 + ft_pct * 65)
    ball_handling = clamp(30 + ast_p36 * 5 - tov * 2 - height_factor * 20)
    passing = clamp(30 + ast_p36 * 8)
    perimeter_defense = clamp(35 + stl_p36 * 10 + (1 - height_factor) * 15)
    interior_defense = clamp(30 + blk_p36 * 12 + height_factor * 20)
    stealing = clamp(30 + stl_p36 * 20)
    blocking = clamp(25 + blk_p36 * 20 + height_factor * 15)
    
    orb_rate = reb_p36 * 0.3
    offensive_rebounding = clamp(30 + orb_rate * 8 + height_factor * 15)
    drb_rate = reb_p36 * 0.7
    defensive_rebounding = clamp(30 + drb_rate * 6 + height_factor * 15)
    
    bball_iq = clamp(40 + (fg_pct * 30) + ast_p36 * 3 - tov * 3 + min(age - 22, 8) * 2)
    work_ethic = clamp(50 + (1 - height_factor) * 10)
    durability = clamp(80 - max(0, age - 28) * 3)
    clutch = clamp(40 + pts_p36 * 1.5 + min(age - 22, 8) * 2)
    
    overall = int(
        inside_scoring * 0.12 + mid_range * 0.08 + three_point * 0.12 +
        ball_handling * 0.08 + passing * 0.08 + perimeter_defense * 0.08 +
        interior_defense * 0.08 + offensive_rebounding * 0.05 +
        defensive_rebounding * 0.07 + speed * 0.08 + strength * 0.04 +
        bball_iq * 0.08 + endurance * 0.04
    )
    overall = clamp(overall, 40, 99)
    
    return {
        'speed': speed, 'strength': strength, 'jumping': jumping, 'endurance': endurance,
        'insideScoring': inside_scoring, 'midRange': mid_range, 'threePoint': three_point,
        'freeThrow': free_throw, 'ballHandling': ball_handling, 'passing': passing,
        'perimeterDefense': perimeter_defense, 'interiorDefense': interior_defense,
        'stealing': stealing, 'blocking': blocking,
        'offensiveRebounding': offensive_rebounding, 'defensiveRebounding': defensive_rebounding,
        'basketballIQ': bball_iq, 'workEthic': work_ethic, 'durability': durability,
        'clutch': clutch, 'overall': overall,
    }


def fetch_salaries_hoopshype() -> Dict[str, Dict]:
    """Scrape player salaries from HoopsHype."""
    print("Fetching salaries from HoopsHype...")
    salaries = {}
    url = "https://hoopshype.com/salaries/players/"
    
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        response = requests.get(url, headers=headers, timeout=30)
        soup = BeautifulSoup(response.text, 'html.parser')
        table = soup.find('table', class_='hh-salaries-ranking-table')
        
        if table:
            rows = table.find_all('tr')[1:]
            for row in rows:
                cells = row.find_all('td')
                if len(cells) >= 2:
                    name_cell = cells[0]
                    name_link = name_cell.find('a')
                    if name_link:
                        player_name = name_link.text.strip()
                        salary_cells = cells[1:7]
                        yearly_salaries = []
                        for cell in salary_cells:
                            sal_text = cell.text.strip().replace('$', '').replace(',', '')
                            if sal_text and sal_text != '-':
                                try:
                                    yearly_salaries.append(int(sal_text))
                                except ValueError:
                                    break
                            else:
                                break
                        if yearly_salaries:
                            salaries[player_name.lower()] = {
                                'salary': yearly_salaries[0],
                                'yearsRemaining': len(yearly_salaries),
                            }
            print(f"Fetched salaries for {len(salaries)} players")
    except Exception as e:
        print(f"Error fetching salaries: {e}")
    
    return salaries


def fetch_all_player_stats() -> Dict[str, Dict]:
    """Fetch current season stats for all players."""
    print("Fetching player stats for current season...")
    stats_dict = {}
    
    try:
        stats = leaguedashplayerstats.LeagueDashPlayerStats(season='2024-25', per_mode_detailed='PerGame')
        time.sleep(1)
        df = stats.get_data_frames()[0]
        
        for _, row in df.iterrows():
            player_id = str(row['PLAYER_ID'])
            stats_dict[player_id] = {
                'pts': row.get('PTS', 0), 'reb': row.get('REB', 0), 'ast': row.get('AST', 0),
                'stl': row.get('STL', 0), 'blk': row.get('BLK', 0), 'tov': row.get('TOV', 0),
                'min': row.get('MIN', 0), 'fg_pct': row.get('FG_PCT', 0) or 0,
                'fg3_pct': row.get('FG3_PCT', 0) or 0, 'ft_pct': row.get('FT_PCT', 0) or 0,
                'fga': row.get('FGA', 0), 'fg3a': row.get('FG3A', 0), 'fta': row.get('FTA', 0),
                'gp': row.get('GP', 0),
            }
        print(f"Fetched stats for {len(stats_dict)} players")
    except Exception as e:
        print(f"Error fetching player stats: {e}")
    
    return stats_dict


def fetch_player_details(player_id: int) -> Optional[Dict]:
    """Fetch detailed player information."""
    try:
        info = commonplayerinfo.CommonPlayerInfo(player_id=player_id)
        time.sleep(0.6)
        data = info.get_data_frames()[0]
        
        if len(data) > 0:
            row = data.iloc[0]
            height_str = row.get('HEIGHT', '6-6')
            try:
                if height_str and '-' in str(height_str):
                    feet, inches = height_str.split('-')
                    height = int(feet) * 12 + int(inches)
                else:
                    height = 78
            except:
                height = 78
            
            try:
                weight = int(row.get('WEIGHT', 200))
            except:
                weight = 200
            
            birthdate_str = row.get('BIRTHDATE', '')
            try:
                if birthdate_str:
                    birthdate = datetime.strptime(str(birthdate_str)[:10], '%Y-%m-%d')
                    age = (datetime.now() - birthdate).days // 365
                else:
                    age = 25
            except:
                age = 25
            
            return {
                'height': height, 'weight': weight, 'age': age, 'birthYear': datetime.now().year - age,
                'position': normalize_position(row.get('POSITION', 'F')),
                'jersey': row.get('JERSEY', '0'),
                'yearsExperience': int(row.get('SEASON_EXP', 0)),
                'college': row.get('SCHOOL', ''), 'country': row.get('COUNTRY', 'USA'),
                'draftYear': row.get('DRAFT_YEAR'), 'draftRound': row.get('DRAFT_ROUND'),
                'draftPick': row.get('DRAFT_NUMBER'),
            }
    except Exception as e:
        print(f"Error fetching player {player_id}: {e}")
    return None


def fetch_team_rosters() -> Dict[str, List[Dict]]:
    """Fetch rosters for all teams."""
    print("Fetching team rosters...")
    rosters = {}
    nba_teams = teams.get_teams()
    
    for team in nba_teams:
        team_id = team['id']
        abbrev = normalize_team_abbrev(team['abbreviation'])
        try:
            roster = commonteamroster.CommonTeamRoster(team_id=team_id, season='2024-25')
            time.sleep(0.6)
            df = roster.get_data_frames()[0]
            rosters[abbrev] = []
            for _, row in df.iterrows():
                rosters[abbrev].append({
                    'id': str(row['PLAYER_ID']),
                    'name': row['PLAYER'],
                    'jersey': str(row.get('NUM', '0')),
                    'position': normalize_position(row.get('POSITION', 'F')),
                })
            print(f"  {abbrev}: {len(rosters[abbrev])} players")
        except Exception as e:
            print(f"Error fetching roster for {abbrev}: {e}")
            rosters[abbrev] = []
    
    return rosters


def build_teams_json() -> List[Dict]:
    """Build teams JSON with real NBA data."""
    return [
        {"id": "ATL", "abbreviation": "ATL", "city": "Atlanta", "name": "Hawks", "conference": "Eastern", "division": "Southeast", "arena": "State Farm Arena", "colors": {"primary": "#E03A3E", "secondary": "#C1D32F"}},
        {"id": "BOS", "abbreviation": "BOS", "city": "Boston", "name": "Celtics", "conference": "Eastern", "division": "Atlantic", "arena": "TD Garden", "colors": {"primary": "#007A33", "secondary": "#FFFFFF"}},
        {"id": "BKN", "abbreviation": "BKN", "city": "Brooklyn", "name": "Nets", "conference": "Eastern", "division": "Atlantic", "arena": "Barclays Center", "colors": {"primary": "#000000", "secondary": "#FFFFFF"}},
        {"id": "CHA", "abbreviation": "CHA", "city": "Charlotte", "name": "Hornets", "conference": "Eastern", "division": "Southeast", "arena": "Spectrum Center", "colors": {"primary": "#1D1160", "secondary": "#00788C"}},
        {"id": "CHI", "abbreviation": "CHI", "city": "Chicago", "name": "Bulls", "conference": "Eastern", "division": "Central", "arena": "United Center", "colors": {"primary": "#CE1141", "secondary": "#000000"}},
        {"id": "CLE", "abbreviation": "CLE", "city": "Cleveland", "name": "Cavaliers", "conference": "Eastern", "division": "Central", "arena": "Rocket Mortgage FieldHouse", "colors": {"primary": "#860038", "secondary": "#041E42"}},
        {"id": "DAL", "abbreviation": "DAL", "city": "Dallas", "name": "Mavericks", "conference": "Western", "division": "Southwest", "arena": "American Airlines Center", "colors": {"primary": "#00538C", "secondary": "#002B5E"}},
        {"id": "DEN", "abbreviation": "DEN", "city": "Denver", "name": "Nuggets", "conference": "Western", "division": "Northwest", "arena": "Ball Arena", "colors": {"primary": "#0E2240", "secondary": "#FEC524"}},
        {"id": "DET", "abbreviation": "DET", "city": "Detroit", "name": "Pistons", "conference": "Eastern", "division": "Central", "arena": "Little Caesars Arena", "colors": {"primary": "#C8102E", "secondary": "#1D42BA"}},
        {"id": "GSW", "abbreviation": "GSW", "city": "Golden State", "name": "Warriors", "conference": "Western", "division": "Pacific", "arena": "Chase Center", "colors": {"primary": "#1D428A", "secondary": "#FFC72C"}},
        {"id": "HOU", "abbreviation": "HOU", "city": "Houston", "name": "Rockets", "conference": "Western", "division": "Southwest", "arena": "Toyota Center", "colors": {"primary": "#CE1141", "secondary": "#000000"}},
        {"id": "IND", "abbreviation": "IND", "city": "Indiana", "name": "Pacers", "conference": "Eastern", "division": "Central", "arena": "Gainbridge Fieldhouse", "colors": {"primary": "#002D62", "secondary": "#FDBB30"}},
        {"id": "LAC", "abbreviation": "LAC", "city": "Los Angeles", "name": "Clippers", "conference": "Western", "division": "Pacific", "arena": "Intuit Dome", "colors": {"primary": "#C8102E", "secondary": "#1D428A"}},
        {"id": "LAL", "abbreviation": "LAL", "city": "Los Angeles", "name": "Lakers", "conference": "Western", "division": "Pacific", "arena": "Crypto.com Arena", "colors": {"primary": "#552583", "secondary": "#FDB927"}},
        {"id": "MEM", "abbreviation": "MEM", "city": "Memphis", "name": "Grizzlies", "conference": "Western", "division": "Southwest", "arena": "FedExForum", "colors": {"primary": "#5D76A9", "secondary": "#12173F"}},
        {"id": "MIA", "abbreviation": "MIA", "city": "Miami", "name": "Heat", "conference": "Eastern", "division": "Southeast", "arena": "Kaseya Center", "colors": {"primary": "#98002E", "secondary": "#000000"}},
        {"id": "MIL", "abbreviation": "MIL", "city": "Milwaukee", "name": "Bucks", "conference": "Eastern", "division": "Central", "arena": "Fiserv Forum", "colors": {"primary": "#00471B", "secondary": "#EEE1C6"}},
        {"id": "MIN", "abbreviation": "MIN", "city": "Minnesota", "name": "Timberwolves", "conference": "Western", "division": "Northwest", "arena": "Target Center", "colors": {"primary": "#0C2340", "secondary": "#236192"}},
        {"id": "NOP", "abbreviation": "NOP", "city": "New Orleans", "name": "Pelicans", "conference": "Western", "division": "Southwest", "arena": "Smoothie King Center", "colors": {"primary": "#0C2340", "secondary": "#C8102E"}},
        {"id": "NYK", "abbreviation": "NYK", "city": "New York", "name": "Knicks", "conference": "Eastern", "division": "Atlantic", "arena": "Madison Square Garden", "colors": {"primary": "#006BB6", "secondary": "#F58426"}},
        {"id": "OKC", "abbreviation": "OKC", "city": "Oklahoma City", "name": "Thunder", "conference": "Western", "division": "Northwest", "arena": "Paycom Center", "colors": {"primary": "#007AC1", "secondary": "#EF3B24"}},
        {"id": "ORL", "abbreviation": "ORL", "city": "Orlando", "name": "Magic", "conference": "Eastern", "division": "Southeast", "arena": "Kia Center", "colors": {"primary": "#0077C0", "secondary": "#C4CED4"}},
        {"id": "PHI", "abbreviation": "PHI", "city": "Philadelphia", "name": "76ers", "conference": "Eastern", "division": "Atlantic", "arena": "Wells Fargo Center", "colors": {"primary": "#006BB6", "secondary": "#ED174C"}},
        {"id": "PHX", "abbreviation": "PHX", "city": "Phoenix", "name": "Suns", "conference": "Western", "division": "Pacific", "arena": "Footprint Center", "colors": {"primary": "#1D1160", "secondary": "#E56020"}},
        {"id": "POR", "abbreviation": "POR", "city": "Portland", "name": "Trail Blazers", "conference": "Western", "division": "Northwest", "arena": "Moda Center", "colors": {"primary": "#E03A3E", "secondary": "#000000"}},
        {"id": "SAC", "abbreviation": "SAC", "city": "Sacramento", "name": "Kings", "conference": "Western", "division": "Pacific", "arena": "Golden 1 Center", "colors": {"primary": "#5A2D81", "secondary": "#63727A"}},
        {"id": "SAS", "abbreviation": "SAS", "city": "San Antonio", "name": "Spurs", "conference": "Western", "division": "Southwest", "arena": "Frost Bank Center", "colors": {"primary": "#C4CED4", "secondary": "#000000"}},
        {"id": "TOR", "abbreviation": "TOR", "city": "Toronto", "name": "Raptors", "conference": "Eastern", "division": "Atlantic", "arena": "Scotiabank Arena", "colors": {"primary": "#CE1141", "secondary": "#000000"}},
        {"id": "UTA", "abbreviation": "UTA", "city": "Utah", "name": "Jazz", "conference": "Western", "division": "Northwest", "arena": "Delta Center", "colors": {"primary": "#002B5C", "secondary": "#F9A01B"}},
        {"id": "WAS", "abbreviation": "WAS", "city": "Washington", "name": "Wizards", "conference": "Eastern", "division": "Southeast", "arena": "Capital One Arena", "colors": {"primary": "#002B5C", "secondary": "#E31837"}},
    ]


def build_players_json(rosters: Dict, stats: Dict, salaries: Dict) -> List[Dict]:
    """Build the complete players JSON."""
    print("\nBuilding player data...")
    all_players = []
    processed_ids = set()
    
    for team_abbrev, roster in rosters.items():
        for player in roster:
            player_id = player['id']
            if player_id in processed_ids:
                continue
            processed_ids.add(player_id)
            
            details = fetch_player_details(int(player_id))
            if not details:
                continue
            
            player_stats = stats.get(player_id, {})
            player_name_lower = player['name'].lower()
            salary_info = salaries.get(player_name_lower, {'salary': 2000000, 'yearsRemaining': 1})
            
            ratings = calculate_player_ratings(player_stats, details['age'], details['height'], details['weight'])
            
            name_parts = player['name'].split(' ', 1)
            first_name = name_parts[0]
            last_name = name_parts[1] if len(name_parts) > 1 else ''
            
            player_obj = {
                'id': f"player-{player_id}",
                'nbaId': player_id,
                'firstName': first_name,
                'lastName': last_name,
                'position': details['position'],
                'height': details['height'],
                'weight': details['weight'],
                'age': details['age'],
                'birthYear': details['birthYear'],
                'yearsExperience': details['yearsExperience'],
                'college': details.get('college', ''),
                'country': details.get('country', 'USA'),
                'jersey': player['jersey'],
                'teamId': team_abbrev,
                'draftYear': details.get('draftYear'),
                'draftRound': details.get('draftRound'),
                'draftPick': details.get('draftPick'),
                'stats': ratings,
                'potential': min(99, ratings['overall'] + max(0, 28 - details['age']) * 2),
                'contract': {
                    'salary': salary_info.get('salary', 2000000),
                    'years': salary_info.get('yearsRemaining', 1),
                    'type': 'standard',
                    'noTradeClause': salary_info.get('salary', 0) > 35000000,
                },
                'currentSeasonStats': {
                    'gamesPlayed': player_stats.get('gp', 0),
                    'minutesPerGame': player_stats.get('min', 0),
                    'points': player_stats.get('pts', 0),
                    'rebounds': player_stats.get('reb', 0),
                    'assists': player_stats.get('ast', 0),
                    'steals': player_stats.get('stl', 0),
                    'blocks': player_stats.get('blk', 0),
                    'turnovers': player_stats.get('tov', 0),
                    'fgPct': player_stats.get('fg_pct', 0),
                    'fg3Pct': player_stats.get('fg3_pct', 0),
                    'ftPct': player_stats.get('ft_pct', 0),
                }
            }
            all_players.append(player_obj)
            
            if len(all_players) % 50 == 0:
                print(f"  Processed {len(all_players)} players...")
    
    print(f"Total players processed: {len(all_players)}")
    return all_players


def main():
    print("=" * 60)
    print("NBA Data Fetcher for Basketball GM")
    print("=" * 60)
    
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    stats = fetch_all_player_stats()
    salaries = fetch_salaries_hoopshype()
    rosters = fetch_team_rosters()
    
    teams_data = build_teams_json()
    with open(os.path.join(OUTPUT_DIR, 'teams.json'), 'w') as f:
        json.dump(teams_data, f, indent=2)
    print(f"\nSaved {len(teams_data)} teams")
    
    players_data = build_players_json(rosters, stats, salaries)
    with open(os.path.join(OUTPUT_DIR, 'players.json'), 'w') as f:
        json.dump(players_data, f, indent=2)
    print(f"Saved {len(players_data)} players")
    
    meta = {
        'generated': datetime.now().isoformat(),
        'season': '2024-25',
        'totalPlayers': len(players_data),
        'totalTeams': len(teams_data),
    }
    with open(os.path.join(OUTPUT_DIR, 'meta.json'), 'w') as f:
        json.dump(meta, f, indent=2)
    
    print("\n" + "=" * 60)
    print("Data fetch complete!")
    print("=" * 60)


if __name__ == '__main__':
    main()
