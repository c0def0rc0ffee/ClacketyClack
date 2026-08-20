#!/usr/bin/env bash
# Packaging build for ClacketyClack, following the same convention as Hooked's
# build-zip.sh (this project's sibling), targeting Linux/Apache. Builds two
# versioned zips straight from the project root, plus the local run copies:
#   ClacketyClack Dist/clacketyclack-v<version>.zip      (deployable files only)
#   ClacketyClack Git/clacketyclack-v<version>-src.zip   (GitHub-bound source tree)
#   ClacketyClack Web/                                   (mirror of the Dist zip contents)
#   /var/www/html/clacketyclack                          (Apache-visible mirror, served
#                                                         at http://clacketyclack/)
# No Vite here: the site is plain static HTML/JS/CSS, so the Web and Apache
# mirrors come straight from the staged source files. The Git zip is the source
# tree plus repo housekeeping; there is no compiled output at all.
#
# There is no test suite in this project yet. The convention's "refuse to
# package on a red suite" rule kicks in the day one is added; wire it in
# before the staging step below.
#
# One-time machine setup (vhost + hosts entry + writable web root) is
#   sudo ./deploy/setup-apache.sh
# The Apache mirror step is skipped with a warning until that has been done.
#
# Run from anywhere:  ./build-zip.sh
#   --no-bump : ship the VERSION file verbatim instead of moving the build
#               segment on. For minor/major releases: hand-edit VERSION to
#               e.g. 1.1.0, build once with --no-bump, and later builds resume
#               incrementing from there (1.1.1, ...).
set -euo pipefail

NO_BUMP=0
for arg in "$@"; do
    case "$arg" in
        --no-bump) NO_BUMP=1 ;;
        *) echo "Unknown option: $arg (only --no-bump is supported)" >&2; exit 2 ;;
    esac
done

warn() { echo "WARNING: $*" >&2; }
die()  { echo "ERROR: $*" >&2; exit 1; }

root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

command -v zip   >/dev/null || die "zip not found. Install it: sudo apt install zip"
command -v rsync >/dev/null || die "rsync not found. Install it: sudo apt install rsync"

# Version scheme is major.minor.BUILD: every packaged build moves the third
# segment on (1.0.0 to 1.0.1), written back to VERSION here so the zips carry
# the new number. Major and minor move only when Rob says so. Edit VERSION by
# hand for those; the build segment then restarts from whatever is written.
version_file="$root/VERSION"
version="$(tr -d '[:space:]' < "$version_file")"
[[ "$version" =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)$ ]] \
    || die "VERSION '$version' is not major.minor.build"
if [[ $NO_BUMP -eq 1 ]]; then
    echo "Building v$version (hand-set, --no-bump)"
else
    version="${BASH_REMATCH[1]}.${BASH_REMATCH[2]}.$((BASH_REMATCH[3] + 1))"
    printf '%s\n' "$version" > "$version_file"
    echo "Building v$version (build segment moved on)"
fi

name='clacketyclack'
dist_dir="$root/ClacketyClack Dist"
git_dir="$root/ClacketyClack Git"
stage="$(mktemp -d /tmp/clacketyclack-build.XXXXXX)"
trap 'rm -rf "$stage"' EXIT

# Excluded from BOTH zips. Nothing secret lives in this tree today (the game
# is entirely client-side with no server component) so these patterns are a
# backstop for the day one gets dropped in. A bare credentials file with no
# extension rode into nine of Coldfront's src zips before its patterns were
# widened, which is why the list is this broad.
both_exclude_files=(--exclude='*.zip' --exclude='*.7z' --exclude='*.tmp' --exclude='*.log' --exclude='.env'
                    --exclude='*SFTP*' --exclude='*FTP*' --exclude='*sftp*' --exclude='*ftp*'
                    --exclude='*credential*' --exclude='*password*' --exclude='*secret*'
                    --exclude='*.pem' --exclude='*.key' --exclude='id_rsa*')

# Never staged into either zip: convention output folders, tooling and
# generated trees.
# The Git zip is the source tree to push, not a clone: '.git/' stays out of it.
exclude_dirs=(--exclude='ClacketyClack Dist/' --exclude='ClacketyClack Git/'
              --exclude='ClacketyClack Web/'
              --exclude='.claude/' --exclude='$RECYCLE.BIN/'
              --exclude='node_modules/' --exclude='.git/')

# Housekeeping that ships in the Git zip but never in the Dist zip or the
# run mirrors: the deployable is runtime files only.
housekeeping_excludes=(--exclude='README.md' --exclude='CHANGELOG.md' --exclude='VERSION'
                       --exclude='LICENSE'
                       --exclude='.gitignore' --exclude='.gitattributes'
                       --exclude='build-zip.sh' --exclude='deploy/' --exclude='tools/'
                       --exclude='screenshots/'
                       --exclude='package.json' --exclude='package-lock.json'
                       --exclude='*.example.*')

mkdir -p "$dist_dir" "$git_dir"

make_zip() {
    local source_dir="$1" destination="$2"
    rm -f "$destination"
    (cd "$source_dir" && zip -qr "$destination" .)
}

zip_size_mb() {
    local bytes
    bytes="$(stat -c%s "$1")"
    awk -v b="$bytes" 'BEGIN { printf "%.2f", b / 1048576 }'
}

# 1) Dist zip: runtime/deployable files only, staged straight from the source
#    tree (no build step, the source IS the deployable).
deploy_stage="$stage/deploy"
rsync -a "${both_exclude_files[@]}" "${exclude_dirs[@]}" "${housekeeping_excludes[@]}" \
      "$root/" "$deploy_stage/"

# Stamp the version onto the menu. VERSION itself is housekeeping and never
# ships, so the number has to be baked in here; the repo copy keeps saying
# "dev", which is exactly what you want when running from source.
sed -i "s|<p class=\"version\" id=\"version\">dev</p>|<p class=\"version\" id=\"version\">v$version</p>|" \
    "$deploy_stage/index.html"
grep -q ">v$version<" "$deploy_stage/index.html" \
    || die "version stamp failed: the placeholder in index.html has moved"

dist_zip="$dist_dir/$name-v$version.zip"
make_zip "$deploy_stage" "$dist_zip"
echo "Built: $dist_zip ($(zip_size_mb "$dist_zip") MB)"

# 2) Local run copies: exact mirrors of the Dist zip contents.
#    --delete removes anything not in the stage. Never hand-edit these folders.
lamp_www='/var/www/html'
lamp_dir="$lamp_www/$name"
web_dirs=("$root/ClacketyClack Web")
if [[ -d "$lamp_www" ]]; then
    if [[ -w "$lamp_dir" || ( ! -e "$lamp_dir" && -w "$lamp_www" ) ]]; then
        web_dirs+=("$lamp_dir")
    else
        warn "$lamp_dir is not writable, skipping the Apache mirror. One-time fix:
         sudo ./deploy/setup-apache.sh"
    fi
else
    warn "$lamp_www not found, skipping the Apache mirror"
fi
for web_dir in "${web_dirs[@]}"; do
    mkdir -p "$web_dir"
    rsync -a --delete "$deploy_stage/" "$web_dir/"
    echo "Mirrored: $web_dir"
done

# 3) Git zip: the full source tree. Site files plus repo housekeeping and the
#    deploy scripts; convention folders and generated trees excluded above.
src_stage="$stage/src"
rsync -a "${both_exclude_files[@]}" "${exclude_dirs[@]}" "$root/" "$src_stage/"

git_zip="$git_dir/$name-v$version-src.zip"
make_zip "$src_stage" "$git_zip"
echo "Built: $git_zip ($(zip_size_mb "$git_zip") MB)"
