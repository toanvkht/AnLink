# Algorithm Design Document
## URL Component Similarity Detection for Phishing Detection

**Project**: Fraud Detection, Prevention and Reporting System for Malicious Websites  
**Version**: 1.0  
**Date**: November 22, 2025  
**Author**: Anti-Phishing System Team

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Algorithm Overview](#algorithm-overview)
3. [URL Component Breakdown](#url-component-breakdown)
4. [Similarity Metrics](#similarity-metrics)
5. [Component Analysis](#component-analysis)
6. [Scoring System](#scoring-system)
7. [Threshold Definitions](#threshold-definitions)
8. [Heuristic Rules](#heuristic-rules)
9. [Algorithm Workflow](#algorithm-workflow)
10. [Implementation Pseudocode](#implementation-pseudocode)
11. [Example Calculations](#example-calculations)
12. [Edge Cases and Handling](#edge-cases-and-handling)
13. [Performance Considerations](#performance-considerations)
14. [Testing Strategy](#testing-strategy)

---

## Executive Summary

This document specifies a **Rule-Based URL Component Similarity Detection Algorithm** designed to identify phishing websites by analyzing and comparing URL components against a database of known phishing patterns and legitimate brand URLs.

### Key Innovation

Unlike traditional blacklist-only approaches, this algorithm:
- **Decomposes URLs** into atomic components (scheme, domain, subdomain, path, query, etc.)
- **Applies multiple similarity metrics** to each component
- **Uses weighted scoring** to combine component-level scores into an overall risk assessment
- **Incorporates heuristic rules** for suspicious patterns
- **Produces explainable results** showing which components triggered the detection

### Algorithm Type

**Non-AI, Rule-Based System** with deterministic behavior:
- No machine learning training required
- Transparent decision-making process
- Easily auditable and debuggable
- Real-time performance (< 50ms per URL)

---

## Algorithm Overview

### High-Level Architecture

```
Input URL
    â†"
[1] URL Parsing & Normalization
    â†"
[2] Component Extraction
    â†"
[3] Database Lookup (Exact Match Check)
    â†" (if no exact match)
[4] Component-Level Similarity Analysis
    â†"
    ├─→ [4a] Domain Similarity
    ├─→ [4b] Subdomain Analysis
    ├─→ [4c] Path Similarity
    ├─→ [4d] Query Parameter Analysis
    └─→ [4e] Heuristic Checks
    â†"
[5] Score Aggregation (Weighted Sum)
    â†"
[6] Threshold Classification
    â†"
Output: {score, classification, details}
```

### Design Principles

1. **Layered Detection**: Multiple independent checks increase accuracy
2. **Weighted Components**: Different parts of URL have different phishing indicators
3. **Explainability**: Every score includes breakdown of contributing factors
4. **Configurability**: Weights and thresholds can be tuned without code changes
5. **Performance**: Optimized for real-time browser extension use

---

## URL Component Breakdown

### Standard URL Structure

```
https://login.secure-vietinbank.com:443/verify/account?id=123&token=abc#section

├─ scheme: https
├─ subdomain: login.secure
├─ domain: vietinbank.com
├─ port: 443
├─ path: /verify/account
├─ query: id=123&token=abc
└─ fragment: section
```

### Component Definitions

| Component | Description | Phishing Relevance |
|-----------|-------------|-------------------|
| **scheme** | Protocol (http/https) | HTTP (not HTTPS) is suspicious for banking |
| **subdomain** | Prefix before domain | Attackers add keywords like "secure", "login" |
| **domain** | Main domain name | Core target of typosquatting |
| **TLD** | Top-level domain (.com, .vn) | Unusual TLDs (.tk, .ml) are suspicious |
| **port** | Port number | Non-standard ports can indicate phishing |
| **path** | URL path segments | May contain keywords like "verify", "update" |
| **query** | Query parameters | Long random strings, sensitive keywords |
| **fragment** | Fragment identifier | Rarely used in phishing detection |

### Normalization Rules

Before analysis, URLs are normalized:

```javascript
// Normalization process
1. Convert to lowercase: "HTTPS://Example.COM" → "https://example.com"
2. Remove trailing slash: "example.com/" → "example.com"
3. Sort query parameters: "?b=2&a=1" → "?a=1&b=2"
4. Remove fragment: "example.com#section" → "example.com"
5. Decode percent-encoding: "%20" → " "
6. Add default port if missing: "http://x" → "http://x:80"
```

---

## Similarity Metrics

### 1. Levenshtein Distance (Edit Distance)

**Purpose**: Measure character-level differences between two strings

**Formula**:
```
Let s1, s2 be two strings of length m, n

LevenshteinDistance(s1, s2) = minimum number of single-character edits:
  - Insertion
  - Deletion  
  - Substitution

Normalized Score = 1 - (distance / max(len(s1), len(s2)))
```

**Example**:
```
s1 = "paypal"
s2 = "paypai"  (substituted 'l' with 'i')

Distance = 1
Max Length = 6
Similarity = 1 - (1/6) = 0.833 (83.3%)
```

**Use Cases**:
- Domain typosquatting: "paypal.com" vs "paypai.com"
- Subdomain similarity: "secure" vs "secur3"

**Implementation Note**: Use dynamic programming for O(m*n) time complexity

---

### 2. Jaro-Winkler Similarity

**Purpose**: Better for short strings, gives more weight to common prefix

**Formula**:
```
JaroSimilarity(s1, s2) = 1/3 * (m/|s1| + m/|s2| + (m-t)/m)

Where:
  m = number of matching characters
  t = number of transpositions
  Matching window = max(|s1|, |s2|) / 2 - 1

JaroWinkler(s1, s2) = Jaro + (L * P * (1 - Jaro))

Where:
  L = length of common prefix (max 4)
  P = scaling factor (typically 0.1)
```

**Example**:
```
s1 = "facebook"
s2 = "faceb00k"  (replaced 'oo' with '00')

Common prefix = "faceb" (length 5, capped at 4)
Jaro = 0.917
JaroWinkler = 0.917 + (4 * 0.1 * (1 - 0.917)) = 0.950 (95%)
```

**Use Cases**:
- Brand name similarity: "microsoft" vs "micros0ft"
- Homoglyph detection: "apple" vs "app1e"

---

### 3. Token-Based Similarity (Jaccard)

**Purpose**: Compare sets of tokens (words/substrings)

**Formula**:
```
Tokens(s) = set of words/n-grams from string s

JaccardSimilarity(s1, s2) = |Tokens(s1) ∩ Tokens(s2)| / |Tokens(s1) ∪ Tokens(s2)|
```

**Example**:
```
s1 = "secure-login-vietinbank"
Tokens = {"secure", "login", "vietinbank"}

s2 = "vietinbank-secure-verify"  
Tokens = {"vietinbank", "secure", "verify"}

Intersection = {"secure", "vietinbank"}  (2 tokens)
Union = {"secure", "login", "vietinbank", "verify"}  (4 tokens)

Similarity = 2/4 = 0.500 (50%)
```

**Use Cases**:
- Subdomain keyword matching
- Path component similarity

---

### 4. Longest Common Substring (LCS)

**Purpose**: Find longest contiguous matching sequence

**Formula**:
```
LCS(s1, s2) = length of longest substring present in both

LCSSimilarity = 2 * LCS / (len(s1) + len(s2))
```

**Example**:
```
s1 = "paypal.com"
s2 = "paypal-secure.com"

LCS = "paypal"  (length 6)
Similarity = 2 * 6 / (10 + 18) = 12/28 = 0.429 (42.9%)
```

**Use Cases**:
- Detecting embedded brand names
- Compound domain analysis

---

## Component Analysis

### Domain Similarity Analysis

**Weight**: 40% (highest priority)

**Algorithm**:

```python
def analyze_domain(target_domain, known_phishing_domains, legitimate_brands):
    scores = []
    
    # Step 1: Check exact match against known phishing
    if target_domain in known_phishing_domains:
        return {
            'score': 1.00,
            'reason': 'exact_match_phishing_db',
            'matched': target_domain
        }
    
    # Step 2: Check exact match against legitimate brands
    if target_domain in legitimate_brands:
        return {
            'score': 0.00,
            'reason': 'exact_match_legitimate',
            'matched': target_domain
        }
    
    # Step 3: Compare against legitimate brands using similarity metrics
    for brand_domain in legitimate_brands:
        # Calculate multiple similarity scores
        lev_score = levenshtein_similarity(target_domain, brand_domain)
        jw_score = jaro_winkler_similarity(target_domain, brand_domain)
        lcs_score = lcs_similarity(target_domain, brand_domain)
        
        # Average the scores
        avg_score = (lev_score * 0.4 + jw_score * 0.4 + lcs_score * 0.2)
        
        if avg_score >= 0.75:  # High similarity threshold
            scores.append({
                'score': avg_score,
                'reason': 'high_similarity_to_brand',
                'matched': brand_domain,
                'metrics': {
                    'levenshtein': lev_score,
                    'jaro_winkler': jw_score,
                    'lcs': lcs_score
                }
            })
    
    # Step 4: Check for typosquatting patterns
    typo_score = check_typosquatting(target_domain, legitimate_brands)
    if typo_score > 0:
        scores.append({
            'score': typo_score,
            'reason': 'typosquatting_pattern',
            'details': '...'
        })
    
    # Return highest suspicious score found
    if scores:
        return max(scores, key=lambda x: x['score'])
    else:
        return {'score': 0.00, 'reason': 'no_similarity_detected'}
```

**Typosquatting Patterns Detected**:

1. **Character Substitution**:
   - Visual: `paypal.com` → `paypa1.com` (l→1)
   - Keyboard proximity: `facebook.com` → `facwbook.com` (e→w nearby)
   - Homoglyphs: `google.com` → `goog1e.com` (l→1)

2. **Character Insertion**:
   - `amazon.com` → `amazon-secure.com`
   - `apple.com` → `apple-id.com`

3. **Character Deletion**:
   - `microsoft.com` → `microsft.com`

4. **Character Transposition**:
   - `twitter.com` → `twtiter.com`

5. **Domain Squatting**:
   - `paypal.com` → `paypal.com.secure-login.tk`

---

### Subdomain Analysis

**Weight**: 25%

**Algorithm**:

```python
def analyze_subdomain(subdomain, domain, known_brands):
    score = 0.0
    flags = []
    
    # Check if subdomain contains suspicious keywords
    suspicious_keywords = [
        'secure', 'login', 'verify', 'account', 'update',
        'confirm', 'banking', 'wallet', 'authentication',
        'signin', 'password', 'security', 'validation'
    ]
    
    subdomain_lower = subdomain.lower()
    keyword_count = sum(1 for kw in suspicious_keywords if kw in subdomain_lower)
    
    if keyword_count > 0:
        # More keywords = more suspicious
        score += min(keyword_count * 0.15, 0.45)  # Cap at 0.45
        flags.append(f'contains_{keyword_count}_suspicious_keywords')
    
    # Check for brand name in subdomain (misleading)
    for brand in known_brands:
        if brand.lower() in subdomain_lower and brand.lower() != domain.lower():
            score += 0.35
            flags.append(f'contains_brand_name_{brand}_in_subdomain')
    
    # Check subdomain length (overly long is suspicious)
    if len(subdomain) > 30:
        score += 0.20
        flags.append('unusually_long_subdomain')
    
    # Check for multiple levels (e.g., secure.login.fake-bank.com)
    subdomain_levels = subdomain.count('.')
    if subdomain_levels >= 2:
        score += subdomain_levels * 0.10
        flags.append(f'multiple_subdomain_levels_{subdomain_levels}')
    
    # Check for numbers and hyphens (less common in legitimate)
    if re.search(r'\d{2,}', subdomain):  # 2+ consecutive digits
        score += 0.15
        flags.append('contains_multiple_digits')
    
    if subdomain.count('-') >= 2:
        score += 0.10
        flags.append('multiple_hyphens')
    
    return {
        'score': min(score, 1.0),  # Cap at 1.0
        'flags': flags
    }
```

**Examples**:

```
Input: "secure-login.fake-vietinbank.com"
Subdomain: "secure-login"
Domain: "fake-vietinbank.com"

Detected:
  ✓ Contains 2 suspicious keywords ('secure', 'login'): +0.30
  ✓ Contains 1 hyphen: +0.10
Total Score: 0.40 (40%)
```

---

### Path Analysis

**Weight**: 15%

**Algorithm**:

```python
def analyze_path(path, domain):
    score = 0.0
    flags = []
    
    if not path or path == '/':
        return {'score': 0.0, 'flags': ['root_path']}
    
    path_lower = path.lower()
    
    # Suspicious path keywords
    suspicious_path_keywords = [
        'verify', 'confirm', 'update', 'secure', 'account',
        'signin', 'login', 'password', 'reset', 'suspended',
        'locked', 'unusual', 'activity', 'validate', 'authentication'
    ]
    
    path_keyword_count = sum(1 for kw in suspicious_path_keywords if kw in path_lower)
    
    if path_keyword_count > 0:
        score += min(path_keyword_count * 0.20, 0.60)
        flags.append(f'contains_{path_keyword_count}_suspicious_keywords')
    
    # Check path depth (very deep paths suspicious)
    path_depth = path.count('/')
    if path_depth > 5:
        score += 0.20
        flags.append(f'deep_path_structure_{path_depth}_levels')
    
    # Check for encoded characters
    if '%' in path:
        encoded_count = path.count('%')
        score += min(encoded_count * 0.05, 0.20)
        flags.append(f'contains_{encoded_count}_encoded_characters')
    
    # Check for obfuscation patterns
    if re.search(r'\.\./', path):
        score += 0.30
        flags.append('path_traversal_pattern')
    
    return {
        'score': min(score, 1.0),
        'flags': flags
    }
```

---

### Query Parameter Analysis

**Weight**: 10%

**Algorithm**:

```python
def analyze_query_params(query_string):
    score = 0.0
    flags = []
    
    if not query_string:
        return {'score': 0.0, 'flags': ['no_query_params']}
    
    # Parse parameters
    params = parse_qs(query_string)
    
    # Suspicious parameter names
    suspicious_param_names = [
        'redirect', 'return', 'goto', 'url', 'link', 'next',
        'continue', 'target', 'destination', 'forward'
    ]
    
    for param_name in params.keys():
        param_name_lower = param_name.lower()
        
        # Check suspicious names
        if param_name_lower in suspicious_param_names:
            score += 0.25
            flags.append(f'suspicious_param_name_{param_name}')
        
        # Check parameter value characteristics
        param_value = params[param_name][0]
        
        # Very long values (potential base64 encoded data)
        if len(param_value) > 100:
            score += 0.15
            flags.append(f'very_long_param_value_{param_name}')
        
        # Check if value looks like a URL (open redirect risk)
        if param_value.startswith('http://') or param_value.startswith('https://'):
            score += 0.30
            flags.append(f'url_in_param_{param_name}')
    
    # Check total number of parameters (many params suspicious)
    if len(params) > 10:
        score += 0.20
        flags.append(f'many_parameters_{len(params)}')
    
    return {
        'score': min(score, 1.0),
        'flags': flags
    }
```

---

### Heuristic Checks

**Weight**: 10%

**Purpose**: Catch additional suspicious patterns not covered by similarity

**Rules**:

```python
def heuristic_checks(url_components, domain):
    score = 0.0
    flags = []
    
    # 1. HTTP instead of HTTPS for banking/financial domains
    if url_components['scheme'] == 'http':
        financial_keywords = ['bank', 'pay', 'wallet', 'credit', 'finance']
        if any(kw in domain.lower() for kw in financial_keywords):
            score += 0.40
            flags.append('http_on_financial_domain')
    
    # 2. IP address instead of domain name
    if re.match(r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$', domain):
        score += 0.50
        flags.append('ip_address_used')
    
    # 3. Suspicious TLD (free domains often used in phishing)
    suspicious_tlds = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top', '.club']
    if any(domain.endswith(tld) for tld in suspicious_tlds):
        score += 0.30
        flags.append('suspicious_tld')
    
    # 4. Port number specified (unusual for normal websites)
    if url_components.get('port') and url_components['port'] not in ['80', '443']:
        score += 0.20
        flags.append(f"non_standard_port_{url_components['port']}")
    
    # 5. Excessive length (> 75 characters is suspicious)
    full_url = url_components['original_url']
    if len(full_url) > 75:
        score += 0.15
        flags.append(f'excessive_length_{len(full_url)}_chars')
    
    # 6. Domain contains "@" symbol (can be used to hide real domain)
    if '@' in domain:
        score += 0.50
        flags.append('at_symbol_in_domain')
    
    # 7. Too many subdomains (e.g., a.b.c.d.example.com)
    subdomain_count = domain.count('.') - 1  # Minus the TLD separator
    if subdomain_count > 3:
        score += 0.25
        flags.append(f'excessive_subdomains_{subdomain_count}')
    
    # 8. Domain contains excessive hyphens
    if domain.count('-') >= 3:
        score += 0.20
        flags.append(f'excessive_hyphens_{domain.count("-")}')
    
    return {
        'score': min(score, 1.0),
        'flags': flags
    }
```

---

## Scoring System

### Weighted Aggregation Formula

```
Final Score = Σ (Component_Score_i × Weight_i)

Where:
  Component_Score_i ∈ [0.0, 1.0]  (0 = safe, 1 = definitely phishing)
  Weight_i ∈ [0.0, 1.0]
  Σ Weight_i = 1.0  (weights sum to 100%)
```

### Default Weights

| Component | Weight | Justification |
|-----------|--------|---------------|
| Domain Similarity | 40% | Most critical indicator; core of phishing |
| Subdomain Analysis | 25% | Attackers often add misleading subdomains |
| Path Analysis | 15% | Suspicious paths indicate phishing intent |
| Query Parameters | 10% | Can contain redirect attacks |
| Heuristic Checks | 10% | Catch edge cases and obvious patterns |

**Total**: 100%

### Score Calculation Example

```javascript
// Example URL: https://secure-login.fake-paypal-verify.com/confirm/account?redirect=http://evil.com

Components Analysis Results:
  - Domain Similarity:  0.85  (85% similar to "paypal.com")
  - Subdomain Analysis: 0.45  (contains "secure", "login" keywords)
  - Path Analysis:      0.40  (contains "confirm", "account")
  - Query Parameters:   0.55  (has redirect with external URL)
  - Heuristic Checks:   0.30  (excessive hyphens, suspicious TLD)

Final Score = (0.85 × 0.40) + (0.45 × 0.25) + (0.40 × 0.15) + (0.55 × 0.10) + (0.30 × 0.10)
            = 0.34 + 0.1125 + 0.06 + 0.055 + 0.03
            = 0.5975
            ≈ 0.60 (60% phishing likelihood)
```

---

## Threshold Definitions

### Classification Rules

```python
def classify_risk(final_score):
    """
    Classify URL based on aggregated score
    
    Args:
        final_score: float between 0.0 and 1.0
    
    Returns:
        classification: str ('safe', 'suspicious', 'dangerous')
        action: str (recommended action for user)
        confidence: str (confidence level)
    """
    
    if final_score < 0.30:
        return {
            'classification': 'safe',
            'action': 'allow',
            'confidence': 'high',
            'message': 'No significant phishing indicators detected',
            'color': 'green',
            'icon': '✓'
        }
    
    elif 0.30 <= final_score < 0.60:
        return {
            'classification': 'suspicious',
            'action': 'warn',
            'confidence': 'medium',
            'message': 'Some phishing indicators detected. Proceed with caution.',
            'color': 'orange',
            'icon': '⚠'
        }
    
    else:  # final_score >= 0.60
        return {
            'classification': 'dangerous',
            'action': 'block',
            'confidence': 'high',
            'message': 'Strong phishing indicators detected. Access blocked for your safety.',
            'color': 'red',
            'icon': '✗'
        }
```

### Threshold Justification

| Threshold | Range | Rationale |
|-----------|-------|-----------|
| **Safe** | 0.00 - 0.29 | Low false positive rate; user can browse normally |
| **Suspicious** | 0.30 - 0.59 | Warn user but allow override; may be false positive |
| **Dangerous** | 0.60 - 1.00 | High confidence phishing; block by default |

### Adjustable Thresholds

Thresholds can be tuned based on:
- **False positive rate**: Lower thresholds → more warnings (safer but annoying)
- **False negative rate**: Higher thresholds → fewer warnings (riskier but smoother UX)
- **User feedback**: Adjust based on community reports
- **Threat landscape**: Tighten during active campaigns

Stored in `system_settings` table:
```sql
INSERT INTO system_settings (setting_key, setting_value, value_type)
VALUES 
  ('threshold_safe_max', '0.29', 'decimal'),
  ('threshold_suspicious_min', '0.30', 'decimal'),
  ('threshold_suspicious_max', '0.59', 'decimal'),
  ('threshold_dangerous_min', '0.60', 'decimal');
```

---

## Heuristic Rules

### Additional Pattern Matching Rules

Beyond the component analysis, these heuristic rules provide additional detection:

#### 1. Brand Impersonation Detection

```python
KNOWN_BRANDS = {
    'financial': ['vietinbank', 'techcombank', 'paypal', 'visa', 'mastercard'],
    'tech': ['google', 'facebook', 'microsoft', 'apple', 'amazon'],
    'social': ['twitter', 'instagram', 'linkedin', 'tiktok']
}

def detect_brand_impersonation(domain, subdomain):
    """
    Check if URL attempts to impersonate a known brand
    """
    full_domain = f"{subdomain}.{domain}" if subdomain else domain
    
    for category, brands in KNOWN_BRANDS.items():
        for brand in brands:
            # Check if brand name appears in wrong position
            if brand in subdomain.lower() and brand not in domain.lower():
                return {
                    'detected': True,
                    'brand': brand,
                    'reason': 'brand_in_subdomain_not_domain',
                    'score': 0.70
                }
            
            # Check for brand + suspicious keywords
            if brand in domain.lower():
                suspicious_combos = [
                    f'{brand}-secure',
                    f'{brand}-verify',
                    f'{brand}-login',
                    f'secure-{brand}',
                    f'verify-{brand}'
                ]
                if any(combo in full_domain.lower() for combo in suspicious_combos):
                    return {
                        'detected': True,
                        'brand': brand,
                        'reason': 'brand_with_suspicious_keyword',
                        'score': 0.65
                    }
    
    return {'detected': False}
```

#### 2. Homoglyph Detection

```python
HOMOGLYPHS = {
    'a': ['à', 'á', 'â', 'ã', 'ä', 'å', 'ª', 'α', 'а'],
    'e': ['è', 'é', 'ê', 'ë', 'е', 'ε'],
    'i': ['ì', 'í', 'î', 'ï', 'ı', 'і', 'ι'],
    'o': ['ò', 'ó', 'ô', 'õ', 'ö', 'о', 'ο', '0'],
    'u': ['ù', 'ú', 'û', 'ü', 'μ'],
    'c': ['ç', 'с', 'ϲ'],
    'l': ['1', 'ı', 'l', '|'],
    'g': ['9', 'q'],
    's': ['5', '$'],
    'z': ['2'],
}

def detect_homoglyphs(domain):
    """
    Detect use of look-alike characters
    """
    suspicious_chars = []
    normalized_domain = domain
    
    for char in domain:
        for ascii_char, lookalikes in HOMOGLYPHS.items():
            if char in lookalikes:
                suspicious_chars.append({
                    'char': char,
                    'position': domain.index(char),
                    'looks_like': ascii_char
                })
                normalized_domain = normalized_domain.replace(char, ascii_char)
    
    if suspicious_chars:
        return {
            'detected': True,
            'homoglyphs': suspicious_chars,
            'normalized': normalized_domain,
            'score': min(len(suspicious_chars) * 0.25, 0.75)
        }
    
    return {'detected': False}
```

#### 3. Punycode/IDN Detection

```python
def detect_idn_homograph(domain):
    """
    Detect Internationalized Domain Name (IDN) homograph attacks
    
    Example: "xn--pple-43d.com" decodes to "аpple.com" (Cyrillic 'а')
    """
    if domain.startswith('xn--'):
        try:
            decoded = domain.encode('ascii').decode('idna')
            return {
                'detected': True,
                'punycode': domain,
                'decoded': decoded,
                'reason': 'punycode_idn_detected',
                'score': 0.80  # High risk
            }
        except:
            pass
    
    # Check for mixed scripts (Latin + Cyrillic)
    scripts = set()
    for char in domain:
        if '\u0400' <= char <= '\u04FF':  # Cyrillic
            scripts.add('cyrillic')
        elif '\u0041' <= char <= '\u007A':  # Latin
            scripts.add('latin')
    
    if len(scripts) > 1:
        return {
            'detected': True,
            'reason': 'mixed_character_scripts',
            'scripts': list(scripts),
            'score': 0.70
        }
    
    return {'detected': False}
```

---

## Algorithm Workflow

### Complete Flowchart

```
START: Receive URL input
    |
    v
[1] Parse URL into components
    |  (scheme, domain, subdomain, path, query, port)
    |
    v
[2] Normalize URL
    |  (lowercase, sort params, remove fragment)
    |
    v
[3] Generate URL hash (SHA-256)
    |
    v
[4] Check suspicious_urls table
    |
    ├──> [Found with status='confirmed_phishing']
    |         |
    |         v
    |    RETURN: {score: 1.00, classification: 'dangerous', reason: 'known_phishing'}
    |
    └──> [Not found or status='pending']
         |
         v
[5] Check known_phishing_urls table (pattern matching)
    |
    ├──> [Exact domain match found]
    |         |
    |         v
    |    RETURN: {score: 1.00, classification: 'dangerous', reason: 'blacklist_match'}
    |
    └──> [No exact match]
         |
         v
[6] Perform Component Analysis
    |
    ├──> [6a] Domain Similarity (weight: 0.40)
    |         ├─ Compare with legitimate brands
    |         ├─ Levenshtein distance
    |         ├─ Jaro-Winkler similarity
    |         ├─ Longest common substring
    |         ├─ Typosquatting checks
    |         └─ Homoglyph detection
    |
    ├──> [6b] Subdomain Analysis (weight: 0.25)
    |         ├─ Suspicious keyword count
    |         ├─ Brand name in subdomain
    |         ├─ Length check
    |         ├─ Multiple levels
    |         └─ Special characters
    |
    ├──> [6c] Path Analysis (weight: 0.15)
    |         ├─ Suspicious path keywords
    |         ├─ Path depth
    |         ├─ Encoded characters
    |         └─ Obfuscation patterns
    |
    ├──> [6d] Query Parameters (weight: 0.10)
    |         ├─ Suspicious param names
    |         ├─ Long param values
    |         ├─ URLs in params
    |         └─ Excessive param count
    |
    └──> [6e] Heuristic Checks (weight: 0.10)
              ├─ HTTP vs HTTPS
              ├─ IP address usage
              ├─ Suspicious TLD
              ├─ Non-standard port
              ├─ Excessive length
              ├─ @ symbol
              └─ Excessive hyphens
    |
    v
[7] Calculate Weighted Score
    |  Final_Score = Σ(Component_Score × Weight)
    |
    v
[8] Apply Threshold Classification
    |
    ├──> [Score < 0.30] → classification: 'safe'
    ├──> [0.30 ≤ Score < 0.60] → classification: 'suspicious'
    └──> [Score ≥ 0.60] → classification: 'dangerous'
    |
    v
[9] Build Detailed Response
    |  {
    |    score: final_score,
    |    classification: 'safe'|'suspicious'|'dangerous',
    |    components: {
    |      domain: {score, details},
    |      subdomain: {score, flags},
    |      path: {score, flags},
    |      query: {score, flags},
    |      heuristics: {score, flags}
    |    },
    |    recommendation: 'allow'|'warn'|'block',
    |    confidence: 'low'|'medium'|'high',
    |    message: "Human-readable explanation"
    |  }
    |
    v
[10] Store Results
     ├─ Insert/update suspicious_urls
     ├─ Insert url_checks
     ├─ Insert scan_results (component details)
     └─ Cache in DynamoDB (7-day TTL)
     |
     v
RETURN: Response JSON to client
     |
     v
END
```

---

## Implementation Pseudocode

### Main Function

```python
def analyze_url(url: str, user_id: Optional[str] = None) -> dict:
    """
    Main entry point for URL phishing detection
    
    Args:
        url: The URL to analyze
        user_id: Optional user ID (for logging)
    
    Returns:
        Analysis result dictionary with score, classification, and details
    """
    
    start_time = time.now()
    
    # Step 1: Parse and normalize URL
    components = parse_url(url)
    normalized_url = normalize_url(url)
    url_hash = sha256(normalized_url)
    
    # Step 2: Check cache (DynamoDB) for recent analysis
    cached_result = check_dynamodb_cache(url_hash)
    if cached_result and not is_expired(cached_result):
        return cached_result
    
    # Step 3: Check exact match in database
    db_result = check_database_exact_match(url_hash)
    if db_result:
        if db_result['status'] == 'confirmed_phishing':
            return build_response(
                score=1.00,
                classification='dangerous',
                reason='known_phishing_database_match',
                details=db_result
            )
    
    # Step 4: Check pattern match in blacklist
    pattern_match = check_pattern_blacklist(components['domain'])
    if pattern_match:
        return build_response(
            score=1.00,
            classification='dangerous',
            reason='blacklist_pattern_match',
            details=pattern_match
        )
    
    # Step 5: Perform component analysis
    analysis_results = {}
    
    # 5a: Domain analysis (40% weight)
    analysis_results['domain'] = analyze_domain(
        components['domain'],
        get_known_phishing_domains(),
        get_legitimate_brands()
    )
    
    # 5b: Subdomain analysis (25% weight)
    analysis_results['subdomain'] = analyze_subdomain(
        components['subdomain'],
        components['domain'],
        get_legitimate_brands()
    )
    
    # 5c: Path analysis (15% weight)
    analysis_results['path'] = analyze_path(
        components['path'],
        components['domain']
    )
    
    # 5d: Query parameter analysis (10% weight)
    analysis_results['query'] = analyze_query_params(
        components['query']
    )
    
    # 5e: Heuristic checks (10% weight)
    analysis_results['heuristics'] = heuristic_checks(
        components,
        components['domain']
    )
    
    # Step 6: Calculate weighted score
    weights = {
        'domain': 0.40,
        'subdomain': 0.25,
        'path': 0.15,
        'query': 0.10,
        'heuristics': 0.10
    }
    
    final_score = sum(
        analysis_results[component]['score'] * weights[component]
        for component in weights.keys()
    )
    
    # Step 7: Classify based on threshold
    classification = classify_risk(final_score)
    
    # Step 8: Build comprehensive response
    response = {
        'url': url,
        'normalized_url': normalized_url,
        'url_hash': url_hash,
        'score': round(final_score, 4),
        'classification': classification['classification'],
        'action': classification['action'],
        'confidence': classification['confidence'],
        'message': classification['message'],
        'components': analysis_results,
        'timestamp': time.now(),
        'response_time_ms': int((time.now() - start_time) * 1000)
    }
    
    # Step 9: Store results in database
    store_analysis_results(response, user_id)
    
    # Step 10: Cache in DynamoDB
    cache_in_dynamodb(url_hash, response, ttl_days=7)
    
    return response
```

### Helper Functions

```python
def parse_url(url: str) -> dict:
    """Parse URL into components"""
    parsed = urllib.parse.urlparse(url)
    
    # Extract subdomain and domain
    hostname_parts = parsed.hostname.split('.')
    if len(hostname_parts) >= 2:
        domain = '.'.join(hostname_parts[-2:])  # example.com
        subdomain = '.'.join(hostname_parts[:-2]) if len(hostname_parts) > 2 else ''
    else:
        domain = parsed.hostname
        subdomain = ''
    
    return {
        'scheme': parsed.scheme,
        'subdomain': subdomain,
        'domain': domain,
        'hostname': parsed.hostname,
        'port': parsed.port or ('443' if parsed.scheme == 'https' else '80'),
        'path': parsed.path,
        'query': parsed.query,
        'fragment': parsed.fragment,
        'username': parsed.username,
        'password': parsed.password
    }

def normalize_url(url: str) -> str:
    """Normalize URL for consistent comparison"""
    parsed = urllib.parse.urlparse(url.lower())
    
    # Sort query parameters
    query_params = urllib.parse.parse_qs(parsed.query)
    sorted_query = '&'.join(f"{k}={v[0]}" for k, v in sorted(query_params.items()))
    
    # Rebuild without fragment
    normalized = urllib.parse.urlunparse((
        parsed.scheme,
        parsed.netloc,
        parsed.path.rstrip('/') or '/',  # Remove trailing slash
        '',  # params
        sorted_query,
        ''  # No fragment
    ))
    
    return normalized

def levenshtein_similarity(s1: str, s2: str) -> float:
    """Calculate normalized Levenshtein similarity"""
    if not s1 or not s2:
        return 0.0
    
    distance = levenshtein_distance(s1, s2)
    max_len = max(len(s1), len(s2))
    
    return 1.0 - (distance / max_len)

def levenshtein_distance(s1: str, s2: str) -> int:
    """Calculate edit distance using dynamic programming"""
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)
    
    if len(s2) == 0:
        return len(s1)
    
    previous_row = range(len(s2) + 1)
    
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
    
    return previous_row[-1]

def jaro_winkler_similarity(s1: str, s2: str, scaling=0.1) -> float:
    """Calculate Jaro-Winkler similarity"""
    jaro_sim = jaro_similarity(s1, s2)
    
    # Calculate common prefix (max 4 characters)
    prefix_len = 0
    for c1, c2 in zip(s1[:4], s2[:4]):
        if c1 == c2:
            prefix_len += 1
        else:
            break
    
    return jaro_sim + (prefix_len * scaling * (1 - jaro_sim))

def jaro_similarity(s1: str, s2: str) -> float:
    """Calculate Jaro similarity"""
    if s1 == s2:
        return 1.0
    
    len1, len2 = len(s1), len(s2)
    if len1 == 0 or len2 == 0:
        return 0.0
    
    match_distance = (max(len1, len2) // 2) - 1
    s1_matches = [False] * len1
    s2_matches = [False] * len2
    
    matches = 0
    transpositions = 0
    
    # Find matches
    for i in range(len1):
        start = max(0, i - match_distance)
        end = min(i + match_distance + 1, len2)
        
        for j in range(start, end):
            if s2_matches[j] or s1[i] != s2[j]:
                continue
            s1_matches[i] = True
            s2_matches[j] = True
            matches += 1
            break
    
    if matches == 0:
        return 0.0
    
    # Count transpositions
    k = 0
    for i in range(len1):
        if not s1_matches[i]:
            continue
        while not s2_matches[k]:
            k += 1
        if s1[i] != s2[k]:
            transpositions += 1
        k += 1
    
    return (matches / len1 + matches / len2 + 
            (matches - transpositions / 2) / matches) / 3.0
```

---

## Example Calculations

### Example 1: Obvious Phishing URL

**Input URL**: `http://secure-login-paypal-verify.tk/confirm/account?redirect=http://evil.com`

**Step 1: Parse Components**
```json
{
  "scheme": "http",
  "subdomain": "secure-login-paypal-verify",
  "domain": "tk",
  "tld": ".tk",
  "path": "/confirm/account",
  "query": "redirect=http://evil.com"
}
```

**Step 2: Component Analysis**

**Domain Analysis (weight: 0.40)**:
- Domain "tk" vs "paypal.com": Levenshtein = 0.10, Jaro-Winkler = 0.15
- TLD ".tk" is suspicious (free domain)
- Component score: **0.30**

**Subdomain Analysis (weight: 0.25)**:
- Contains keywords: "secure" (+0.15), "login" (+0.15), "verify" (+0.15) = 0.45
- Contains brand name "paypal" in subdomain (+0.35)
- Multiple hyphens (+0.10)
- Component score: **0.90** (capped at 1.0, so 0.90)

**Path Analysis (weight: 0.15)**:
- Contains keywords: "confirm" (+0.20), "account" (+0.20)
- Component score: **0.40**

**Query Analysis (weight: 0.10)**:
- Suspicious param "redirect" (+0.25)
- Value contains external URL (+0.30)
- Component score: **0.55**

**Heuristic Checks (weight: 0.10)**:
- HTTP instead of HTTPS on financial-related domain (+0.40)
- Suspicious TLD ".tk" (+0.30)
- Excessive subdomain length (+0.20)
- Component score: **0.90**

**Step 3: Calculate Final Score**
```
Final Score = (0.30 × 0.40) + (0.90 × 0.25) + (0.40 × 0.15) + (0.55 × 0.10) + (0.90 × 0.10)
            = 0.12 + 0.225 + 0.06 + 0.055 + 0.09
            = 0.55
```

**Classification**: **Suspicious** (0.30 ≤ 0.55 < 0.60)  
**Recommendation**: Warn user with option to proceed

**Note**: This is borderline dangerous. The subdomain analysis strongly indicates phishing, but the actual domain doesn't match PayPal closely enough to push it over 0.60. In practice, moderators might adjust this to "dangerous" based on manual review.

---

### Example 2: Sophisticated Typosquatting

**Input URL**: `https://paypa1.com/webapps/signin`

**Step 1: Parse Components**
```json
{
  "scheme": "https",
  "subdomain": "",
  "domain": "paypa1.com",
  "tld": ".com",
  "path": "/webapps/signin"
}
```

**Step 2: Component Analysis**

**Domain Analysis (weight: 0.40)**:
- "paypa1" vs "paypal": 
  - Levenshtein distance = 1 (substitution: l→1)
  - Levenshtein similarity = 1 - (1/6) = 0.833
  - Jaro-Winkler = 0.967 (high due to common prefix "paypa")
  - LCS = "paypa" (length 5), similarity = 2*5/(6+6) = 0.833
- Average: (0.833 * 0.4) + (0.967 * 0.4) + (0.833 * 0.2) = **0.887**
- Homoglyph detection: '1' looks like 'l' (+0.10)
- Component score: **0.95** (0.887 + 0.10, capped at 1.0)

**Subdomain Analysis (weight: 0.25)**:
- No subdomain
- Component score: **0.00**

**Path Analysis (weight: 0.15)**:
- "/webapps/signin" - realistic path for PayPal
- "signin" is mildly suspicious (+0.20)
- Component score: **0.20**

**Query Analysis (weight: 0.10)**:
- No query parameters
- Component score: **0.00**

**Heuristic Checks (weight: 0.10)**:
- HTTPS used (good)
- Legitimate TLD ".com"
- No other red flags
- Component score: **0.00**

**Step 3: Calculate Final Score**
```
Final Score = (0.95 × 0.40) + (0.00 × 0.25) + (0.20 × 0.15) + (0.00 × 0.10) + (0.00 × 0.10)
            = 0.38 + 0 + 0.03 + 0 + 0
            = 0.41
```

**Classification**: **Suspicious** (0.30 ≤ 0.41 < 0.60)  
**Recommendation**: Warn user

**Key Detection**: The algorithm correctly identifies the typosquatting ('1' instead of 'l') and assigns a high domain similarity score. However, the lack of other suspicious indicators keeps it from being classified as "dangerous." This is intentional - a single-character typo alone may not warrant a full block without additional context.

---

### Example 3: Legitimate Banking Site

**Input URL**: `https://www.vietinbank.vn/en/personal/login`

**Step 1: Parse Components**
```json
{
  "scheme": "https",
  "subdomain": "www",
  "domain": "vietinbank.vn",
  "tld": ".vn",
  "path": "/en/personal/login"
}
```

**Step 2: Component Analysis**

**Domain Analysis (weight: 0.40)**:
- "vietinbank.vn" is in legitimate brands database
- **Exact match found** → Component score: **0.00**

**Subdomain Analysis (weight: 0.25)**:
- "www" is standard, no suspicious keywords
- Component score: **0.00**

**Path Analysis (weight: 0.15)**:
- Contains "login" (+0.20)
- However, domain is verified legitimate, so we can reduce this
- Component score: **0.10** (reduced due to legitimate domain)

**Query Analysis (weight: 0.10)**:
- No query parameters
- Component score: **0.00**

**Heuristic Checks (weight: 0.10)**:
- HTTPS used (good)
- Legitimate TLD ".vn" (Vietnam country code)
- Component score: **0.00**

**Step 3: Calculate Final Score**
```
Final Score = (0.00 × 0.40) + (0.00 × 0.25) + (0.10 × 0.15) + (0.00 × 0.10) + (0.00 × 0.10)
            = 0 + 0 + 0.015 + 0 + 0
            = 0.015
```

**Classification**: **Safe** (0.015 < 0.30)  
**Recommendation**: Allow access

**Note**: Legitimate domains in the whitelist get very low scores even if they have suspicious-looking paths like "/login". This demonstrates the importance of maintaining an accurate legitimate brands database.

---

### Example 4: Subdomain Phishing Attack

**Input URL**: `https://vietinbank-secure-login.phishing-example.com/verify?token=abc123`

**Step 1: Parse Components**
```json
{
  "scheme": "https",
  "subdomain": "vietinbank-secure-login",
  "domain": "phishing-example.com",
  "tld": ".com",
  "path": "/verify",
  "query": "token=abc123"
}
```

**Step 2: Component Analysis**

**Domain Analysis (weight: 0.40)**:
- "phishing-example.com" vs "vietinbank.vn"
- Low similarity: ~0.10
- Component score: **0.10**

**Subdomain Analysis (weight: 0.25)**:
- Contains brand name "vietinbank" in subdomain (+0.35)
- Contains keywords: "secure" (+0.15), "login" (+0.15)
- Multiple hyphens: 2 hyphens (+0.10)
- Long subdomain: 24 characters (+0.20)
- Component score: **0.95**

**Path Analysis (weight: 0.15)**:
- Contains "verify" (+0.20)
- Component score: **0.20**

**Query Analysis (weight: 0.10)**:
- "token" parameter: not inherently suspicious
- Component score: **0.05**

**Heuristic Checks (weight: 0.10)**:
- HTTPS used (neutral)
- Legitimate TLD ".com"
- Component score: **0.00**

**Step 3: Calculate Final Score**
```
Final Score = (0.10 × 0.40) + (0.95 × 0.25) + (0.20 × 0.15) + (0.05 × 0.10) + (0.00 × 0.10)
            = 0.04 + 0.2375 + 0.03 + 0.005 + 0
            = 0.3125
```

**Classification**: **Suspicious** (0.30 ≤ 0.31 < 0.60)  
**Recommendation**: Warn user

**Key Detection**: The algorithm catches the brand name in the subdomain, which is a classic phishing technique. The actual domain doesn't match the brand, pushing the score into suspicious territory.

---

## Edge Cases and Handling

### Edge Case 1: Shortened URLs

**Example**: `https://bit.ly/3xY2zK`

**Challenge**: Cannot analyze domain components meaningfully

**Solution**:
```python
SHORTENER_DOMAINS = ['bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'ow.ly']

def handle_url_shortener(domain):
    if domain in SHORTENER_DOMAINS:
        return {
            'is_shortener': True,
            'action': 'expand_and_reanalyze',
            'score': 0.50,  # Moderate risk until expanded
            'message': 'URL shortener detected. Cannot verify destination.'
        }
```

**Implementation**: 
1. Detect URL shortener
2. Attempt to expand URL (HTTP HEAD request, follow redirect)
3. Re-analyze expanded URL
4. If expansion fails, return moderate risk score

---

### Edge Case 2: Base64-Encoded URLs

**Example**: `https://example.com/redirect?url=aHR0cHM6Ly9waGlzaGluZy5jb20=`

**Challenge**: Malicious URL hidden in encoded parameter

**Solution**:
```python
def detect_encoded_urls(query_params):
    for param_name, param_value in query_params.items():
        # Check if value looks like base64
        if re.match(r'^[A-Za-z0-9+/=]{20,}$', param_value):
            try:
                decoded = base64.b64decode(param_value).decode('utf-8')
                
                # Check if decoded value is a URL
                if decoded.startswith('http://') or decoded.startswith('https://'):
                    return {
                        'encoded_url_found': True,
                        'decoded_url': decoded,
                        'action': 'analyze_decoded_url',
                        'score': 0.40  # Suspicious but not definitive
                    }
            except:
                pass
    
    return {'encoded_url_found': False}
```

---

### Edge Case 3: Unicode/Punycode Domains

**Example**: `https://xn--80ak6aa92e.com` (Cyrillic "apple")

**Solution**: Already handled in `detect_idn_homograph()` function (see Heuristic Rules section)

---

### Edge Case 4: Data URIs

**Example**: `data:text/html,<script>...</script>`

**Solution**:
```python
def handle_data_uri(url):
    if url.startswith('data:'):
        return {
            'is_data_uri': True,
            'score': 0.80,  # High risk
            'classification': 'dangerous',
            'message': 'Data URI detected. May contain malicious code.'
        }
```

---

### Edge Case 5: Localhost/Private IPs

**Example**: `http://127.0.0.1:8080/admin`

**Solution**:
```python
def check_private_ip(domain):
    private_ranges = [
        '127.0.0.0/8',     # Localhost
        '10.0.0.0/8',      # Private
        '172.16.0.0/12',   # Private
        '192.168.0.0/16',  # Private
        '169.254.0.0/16'   # Link-local
    ]
    
    if is_ip_in_ranges(domain, private_ranges):
        return {
            'is_private_ip': True,
            'score': 0.00,  # Safe for legitimate development use
            'message': 'Local/private IP address detected'
        }
```

---

### Edge Case 6: Empty or Malformed URLs

**Solution**:
```python
def validate_url(url):
    if not url or len(url) < 7:  # Minimum "http://x"
        raise ValueError('URL too short or empty')
    
    if not url.startswith(('http://', 'https://')):
        raise ValueError('URL must start with http:// or https://')
    
    parsed = urllib.parse.urlparse(url)
    if not parsed.netloc:
        raise ValueError('Invalid URL: no domain found')
```

---

## Performance Considerations

### Optimization Strategies

1. **Database Indexing**:
   ```sql
   -- Already implemented in database_schema.sql
   CREATE INDEX idx_suspicious_urls_hash ON suspicious_urls(url_hash);
   CREATE INDEX idx_phishing_domain_pattern ON known_phishing_urls(domain_pattern);
   ```

2. **Caching**:
   - DynamoDB cache: 7-day TTL for URL analysis results
   - Redis cache: Legitimate brand list (refreshed daily)
   - In-memory cache: Similarity metrics for recently compared strings

3. **Parallel Processing**:
   ```python
   # Analyze components concurrently
   from concurrent.futures import ThreadPoolExecutor
   
   with ThreadPoolExecutor(max_workers=5) as executor:
       futures = {
           'domain': executor.submit(analyze_domain, ...),
           'subdomain': executor.submit(analyze_subdomain, ...),
           'path': executor.submit(analyze_path, ...),
           'query': executor.submit(analyze_query_params, ...),
           'heuristics': executor.submit(heuristic_checks, ...)
       }
       
       analysis_results = {k: f.result() for k, f in futures.items()}
   ```

4. **Algorithm Complexity**:
   - Levenshtein: O(m × n) - acceptable for short strings (domains ~20 chars)
   - Jaro-Winkler: O(m × n)
   - Pattern matching: O(k) where k = number of patterns
   - Overall: O(m × n × k) worst case, but k is typically small (<1000 patterns)

5. **Early Termination**:
   ```python
   # If exact match found, skip similarity analysis
   if exact_match_in_blacklist:
       return immediate_block_response()
   ```

### Performance Targets

| Operation | Target Time | Notes |
|-----------|-------------|-------|
| Single URL analysis | < 50ms | Without external API calls |
| Database lookup | < 5ms | With proper indexing |
| Similarity calculation | < 10ms | Per brand comparison |
| DynamoDB cache read | < 2ms | Sub-millisecond typical |
| Complete analysis | < 100ms | Including all components |

### Monitoring

```python
# Performance logging
import time

def analyze_url_with_metrics(url):
    metrics = {}
    
    start = time.time()
    result = analyze_url(url)
    metrics['total_time'] = time.time() - start
    
    # Log slow requests
    if metrics['total_time'] > 0.100:  # 100ms threshold
        logger.warning(f"Slow analysis: {metrics['total_time']}s for {url}")
    
    result['metrics'] = metrics
    return result
```

---

## Testing Strategy

### Test Categories

#### 1. Unit Tests (Component-Level)

```python
def test_levenshtein_distance():
    assert levenshtein_distance('paypal', 'paypai') == 1
    assert levenshtein_distance('facebook', 'faceb00k') == 2
    assert levenshtein_distance('', 'test') == 4
    assert levenshtein_distance('same', 'same') == 0

def test_domain_similarity():
    result = analyze_domain('paypa1.com', [], ['paypal.com'])
    assert result['score'] > 0.80  # High similarity
    assert 'typosquatting' in result['reason']

def test_subdomain_keywords():
    result = analyze_subdomain('secure-login', 'fake.com', ['bank.com'])
    assert result['score'] > 0.30  # Suspicious keywords
    assert 'suspicious_keywords' in result['flags']
```

#### 2. Integration Tests (Full Algorithm)

```python
def test_obvious_phishing():
    url = 'http://secure-paypal-login.tk/verify?redirect=http://evil.com'
    result = analyze_url(url)
    assert result['score'] >= 0.60  # Should be classified as dangerous
    assert result['classification'] == 'dangerous'

def test_legitimate_site():
    url = 'https://www.paypal.com/signin'
    result = analyze_url(url)
    assert result['score'] < 0.30  # Should be safe
    assert result['classification'] == 'safe'

def test_typosquatting():
    url = 'https://paypa1.com/signin'
    result = analyze_url(url)
    assert result['score'] >= 0.30  # Should be at least suspicious
    assert result['components']['domain']['score'] > 0.75
```

#### 3. Real-World Test Dataset

```python
# Test against known phishing datasets
def test_against_phishtank():
    """Test against PhishTank confirmed phishing URLs"""
    phishing_urls = load_phishtank_dataset()  # ~50,000 URLs
    
    true_positives = 0
    false_negatives = 0
    
    for url in phishing_urls[:1000]:  # Sample 1000
        result = analyze_url(url)
        if result['classification'] in ['suspicious', 'dangerous']:
            true_positives += 1
        else:
            false_negatives += 1
    
    detection_rate = true_positives / 1000
    assert detection_rate >= 0.85  # Target: 85%+ detection rate

def test_against_alexa_top_sites():
    """Test against legitimate websites to measure false positives"""
    legitimate_urls = load_alexa_top_1000()
    
    true_negatives = 0
    false_positives = 0
    
    for url in legitimate_urls:
        result = analyze_url(url)
        if result['classification'] == 'safe':
            true_negatives += 1
        else:
            false_positives += 1
    
    false_positive_rate = false_positives / 1000
    assert false_positive_rate <= 0.05  # Target: <5% false positive rate
```

#### 4. Performance Tests

```python
def test_response_time():
    """Ensure algorithm meets performance targets"""
    url = 'https://example.com/path/to/resource?param=value'
    
    import time
    start = time.time()
    result = analyze_url(url)
    elapsed = time.time() - start
    
    assert elapsed < 0.100  # Should complete in <100ms
    assert 'metrics' in result

def test_concurrent_analysis():
    """Test handling multiple concurrent requests"""
    from concurrent.futures import ThreadPoolExecutor
    
    urls = ['https://test{i}.com' for i in range(100)]
    
    with ThreadPoolExecutor(max_workers=10) as executor:
        start = time.time()
        results = list(executor.map(analyze_url, urls))
        elapsed = time.time() - start
    
    assert len(results) == 100
    assert elapsed < 10.0  # 100 URLs in <10 seconds
```

#### 5. Edge Case Tests

```python
def test_url_shortener():
    result = analyze_url('https://bit.ly/abc123')
    assert result['is_shortener'] == True
    assert result['score'] == 0.50  # Moderate risk

def test_data_uri():
    result = analyze_url('data:text/html,<script>alert(1)</script>')
    assert result['classification'] == 'dangerous'

def test_punycode_domain():
    result = analyze_url('https://xn--80ak6aa92e.com')  # Cyrillic
    assert result['components']['heuristics']['flags'][0] == 'punycode_idn_detected'

def test_empty_url():
    with pytest.raises(ValueError):
        analyze_url('')

def test_malformed_url():
    with pytest.raises(ValueError):
        analyze_url('not-a-url')
```

### Test Coverage Goals

- **Unit tests**: 95%+ code coverage
- **Integration tests**: All main workflows
- **Real-world tests**: 85%+ detection rate, <5% false positive rate
- **Performance tests**: <100ms per URL average
- **Edge cases**: All known edge cases handled

---

## Conclusion

This URL Component Similarity Detection Algorithm provides a robust, explainable, and performant solution for identifying phishing URLs without relying on machine learning. The rule-based approach ensures:

✅ **Transparency**: Every score can be traced back to specific detected patterns  
✅ **Configurability**: Weights and thresholds can be adjusted based on real-world feedback  
✅ **Real-time Performance**: Optimized for <100ms response times  
✅ **Comprehensive Coverage**: Multiple detection layers catch different phishing techniques  
✅ **Maintainability**: No training data required; rules can be updated easily

### Next Steps

1. **Implementation**: Begin coding the algorithm following the pseudocode
2. **Database Integration**: Connect to PostgreSQL/DynamoDB tables
3. **API Endpoint**: Wrap algorithm in REST API (`POST /api/check-url`)
4. **Testing**: Implement test suite with real-world datasets
5. **Tuning**: Adjust weights and thresholds based on initial test results
6. **Deployment**: Deploy to AWS with CloudWatch monitoring

---

**Document Version**: 1.0  
**Last Updated**: November 22, 2025  
**Status**: Ready for Implementation

